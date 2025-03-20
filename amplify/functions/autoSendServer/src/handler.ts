import { APIGatewayEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import chromium from '@sparticuz/chromium';
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

    let friendName: string = (qs.friendName as string);
    let userKey: string = (qs.userKey as string);
    let userMessage: string = (qs.userMessage as string);
    if (!friendName || !userKey || !userMessage) {
      return { statusCode: 400, body: 'friendName, userKey, userMessage 파라미터 필요' };
    }

    // 1. DynamoDB에서 쿠키 정보 조회
    const storedCookies = await getCookiesFromDynamo(userKey);
    const headlessMode = storedCookies ? true : false;
    console.log(`쿠키 존재 여부: ${storedCookies ? '있음' : '없음'}`);

    // 2. Puppeteer 실행
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    let page: Page = await browser.newPage();

    // 3. 쿠키가 저장되어 있다면, 페이지에 주입
    if (storedCookies) {
      await page.setCookie(...storedCookies);
      console.log("쿠키를 브라우저에 주입했습니다.");
    } else {
      console.log("저장된 쿠키가 없으므로, non-headless 모드에서 실행하여 사용자 로그인을 유도합니다.");
      friendName = "send_myself";
    }

    // 4. sendDefault 전용 페이지로 이동 (userKey, userMessage 전달)
    const targetUrl = `${SEND_DEFAULT_URL}?key=${encodeURIComponent(userKey)}&message=${encodeURIComponent(userMessage)}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    console.log('전용 sendDefault 페이지 로드 완료');

    // 4. sendDefault 호출 후 공유 피커 팝업 창이 뜨기를 대기
    const popupTarget: Target = await browser.waitForTarget((target: Target) => {
      // 메인 페이지의 target(opener)이면 공유 피커 팝업으로 판단 (단, URL이 'data:,'가 아니어야 함)
      return target.opener() === page.target() && target.url() !== 'data:,';
    });
    const popupPage: Page | null = await popupTarget.page();
    if (!popupPage) {
      console.error("팝업 페이지를 찾지 못했습니다.");
      return;
    }
    await popupPage.bringToFront();
    console.log('공유 피커 팝업 창 전환 완료');

    // 5. (여기서 sendDefault 호출 후 자동화 작업을 추가할 수 있음)
 const friendListSelector = 'div.unit_chat';
    await popupPage.waitForSelector('div.unit_chat', { timeout: 600000 });
    let friendList = await popupPage.$$(friendListSelector);
    if (friendList.length === 0) {
      console.error("친구 목록을 로드하지 못했습니다. 로그인 상태를 확인하세요.");
      return;
    }
    console.log('친구 목록 로드 완료');

    // 6. 원하는 친구를 찾아 선택
    let friendElements = await popupPage.$$('div.unit_chat');
    let friendFound = false;
    let scrollAttempts = 0;
    // 스크롤이 더 이상 내려가지 않을 때까지 반복
    while (!friendFound) {
      // 현재 페이지의 친구 목록 검색
      friendElements = await popupPage.$$(friendListSelector);
      for (const friendEl of friendElements) {
        const nameEl = await friendEl.$('strong.tit_name');
        if (nameEl) {
          const text: string = await popupPage.evaluate((el: any) => el.innerText, nameEl);
          if (text.trim() === friendName || friendName == "send_myself") {
            const checkBox = await friendEl.$('input.inp_check');
            if (checkBox) {
              await checkBox.click();
              console.log(`"${text.trim()}" 선택 완료`);
              friendFound = true;
              break;
            }
          }
        }
      }
      if (friendFound) break;

      // 스크롤 높이가 더 이상 증가하지 않는지 확인하며 스크롤 진행
      const prevScrollHeight = await popupPage.evaluate(() => {
        const container = document.getElementById('scrollableDiv');
        return container ? container.scrollHeight : document.body.scrollHeight;
      });

      // 스크롤을 내립니다.
      await popupPage.evaluate(() => {
        const container = document.getElementById('scrollableDiv');
        if (container) {
          container.scrollTop = container.scrollHeight;
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 500)); // 2초 대기

      const currentScrollHeight = await popupPage.evaluate(() => {
        const container = document.getElementById('scrollableDiv');
        return container ? container.scrollHeight : document.body.scrollHeight;
      });

      // 스크롤이 더 이상 내려가지 않는 경우 종료
      if (currentScrollHeight === prevScrollHeight) {
        console.log("더 이상 스크롤할 내용이 없습니다.");
        break;
      }
      scrollAttempts++;
      console.log(`스크롤 시도 횟수: ${scrollAttempts}`);
    }

    if (!friendFound) {
      console.error(`"${friendName}"를 찾지 못했습니다.`);
      return;
    }

    // 6. "공유하기" 버튼을 찾아 클릭
    const shareButton = await popupPage.waitForSelector('button.btn_commit', { timeout: 5000 });
    await shareButton.click();
    console.log('공유하기 버튼 클릭 완료');

    
  // 결과 확인을 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 50000));
  } catch (error) {
    console.error("오류 발생:", error);
    if (browser) {
      await browser.close();
    }
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  } finally {
    if (browser) {      
      await browser.close();
    }
  }

  return {
    statusCode: 200,
    body: 'Auto share executed successfully',
  };
};
