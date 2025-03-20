import { APIGatewayEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import chromium from 'chrome-aws-lambda';
import puppeteer, { Browser, Page, Cookie } from 'puppeteer-core';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

// 환경 변수 또는 직접 설정
const COOKIE_TABLE = process.env.COOKIE_TABLE || 'KakaoLoginCookie';
const SEND_DEFAULT_URL = process.env.SEND_DEFAULT_URL || 'https://yourdomain.com/AutoSend';

/**
 * DynamoDB에서 특정 사용자(userId)의 쿠키 정보를 조회하는 함수.
 * 쿠키 정보는 "cookieData" 필드에 JSON 문자열로 저장되어 있다고 가정합니다.
 * @param userId 사용자 ID
 * @returns 쿠키 배열 (Cookie[]) 또는 null (저장된 쿠키 없음)
 */
async function getCookiesFromDynamo(userId: string): Promise<Cookie[] | null> {
  const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const command = new GetItemCommand({
    TableName: COOKIE_TABLE,
    Key: { userId: { S: userId } },
  });
  const response = await ddbClient.send(command);
  if (!response.Item || !response.Item.cookieData || !response.Item.cookieData.S) {
    return null;
  }
  try {
    const cookieData: Cookie[] = JSON.parse(response.Item.cookieData.S);
    return cookieData;
  } catch (e) {
    console.error("쿠키 파싱 오류:", e);
    return null;
  }
}

/**
 * Lambda 핸들러
 * Query string 매개변수:
 *   - userId: 사용자 식별자
 *   - userKey: 카카오 앱 키
 *   - userMessage: 전송할 메시지
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  let browser: Browser | null = null;
  try {
    const qs = event.queryStringParameters || {};
    const userId = qs.userId;
    const userKey = qs.userKey;
    const userMessage = qs.userMessage;
    if (!userId || !userKey || !userMessage) {
      return { statusCode: 400, body: 'userId, userKey, userMessage 파라미터 필요' };
    }

    // 1. DynamoDB에서 쿠키 정보 조회
    const storedCookies = await getCookiesFromDynamo(userId);
    const headlessMode = storedCookies ? true : false;
    console.log(`쿠키 존재 여부: ${storedCookies ? '있음' : '없음'}`);

    // 2. Puppeteer 실행
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: headlessMode,
      // Lambda에서는 일반적으로 /tmp 폴더를 사용 (데이터가 지속되지는 않음)
      // 사용자별 쿠키 관리를 위해서는 DynamoDB에 저장한 쿠키를 주입합니다.
    });
    let page: Page = await browser.newPage();

    // 3. 쿠키가 저장되어 있다면, 페이지에 주입
    if (storedCookies) {
      await page.setCookie(...storedCookies);
      console.log("쿠키를 브라우저에 주입했습니다.");
    } else {
      console.log("저장된 쿠키가 없으므로, non-headless 모드에서 실행하여 사용자 로그인을 유도합니다.");
    }

    // 4. sendDefault 전용 페이지로 이동 (userKey, userMessage 전달)
    const targetUrl = `${SEND_DEFAULT_URL}?key=${encodeURIComponent(userKey)}&message=${encodeURIComponent(userMessage)}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    console.log('전용 sendDefault 페이지 로드 완료');

    // 5. (여기서 sendDefault 호출 후 자동화 작업을 추가할 수 있음)
    // 예: 공유 피커 팝업을 감지하고, 원하는 친구 선택, "공유하기" 버튼 클릭 등의 로직.
    // 본 예제에서는 생략하며, 필요한 경우 기존 Puppeteer 자동화 로직을 여기에 추가하면 됩니다.
    
    // 예시: 잠시 대기 후 브라우저 종료
    await page.waitForTimeout(5000);
    await browser.close();

    return {
      statusCode: 200,
      body: 'Auto share executed successfully',
    };
  } catch (error) {
    console.error("오류 발생:", error);
    if (browser) {
      await browser.close();
    }
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
