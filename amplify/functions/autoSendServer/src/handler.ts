import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page, Cookie, Target } from 'puppeteer-core';
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/auto-send-server'; // replace with your function name
import type { Schema } from "../../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>() 


const requiredCookies = ['_kahai', '_karmt', '_karmtea', '_kawlt', '_kawltea'];

// 환경 변수 또는 직접 설정
const SEND_DEFAULT_URL = process.env.SEND_DEFAULT_URL || 'https://localhost:5173/AutoSend';

/**
 * DynamoDB에서 특정 사용자(userId)의 쿠키 정보를 조회하는 함수.
 * 쿠키 정보는 "cookieData" 필드에 JSON 문자열로 저장되어 있다고 가정합니다.
 * @param userId 사용자 ID
 * @returns 쿠키 배열 (Cookie[]) 또는 null (저장된 쿠키 없음)
 */
async function getCookiesFromDynamo(userId: string): Promise<Cookie[] | null> {
  const { data: response } = await client.models.kakaoLoginCookie.get({id: userId })


  if (!response || !response.cookieData) {
    return null;
  }
  try {
    const cookieData: Cookie[] = JSON.parse(response.cookieData);
    return cookieData;
  } catch (e) {
    console.error("쿠키 파싱 오류:", e);
    return null;
  }
}

async function getLoginInfoFromDynamo(userKey: string): Promise<{ userID: string; userPW: string } | null> {  

  try {
    const { data: response } = await client.models.kakaoLoginInfo.get({id: userKey })
    if (!response) {
      console.error('No credentials found for userKey:', userKey);
      return null;
    }
    const userID = response.userId;
    const userPW = response.userPw;
    if (!userID || !userPW) {
      console.error('Incomplete credentials for userKey:', userKey);
      return null;
    }
    return { userID, userPW };
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    return null;
  }
}

  // DynamoDB에 저장할 때, 필요한 쿠키 데이터만 필터링할 수 있습니다.
  // 여기서는 전체 쿠키를 JSON 문자열로 저장합니다.
  // expireAt은 필수 쿠키 중 가장 빠른 만료 시간을 계산합니다
async function storeCookiesInDynamo(userKey: string, cookies: Cookie[]): Promise<void> {
  // 필수 쿠키의 expire 값 중 가장 작은 값을 계산 (만료 시간이 있는 쿠키만)
  let minExpire: number | null = null;
  for (const cookie of cookies) {
    if (requiredCookies.includes(cookie.name) && cookie.expires && cookie.expires > 0) {
      if (minExpire === null || cookie.expires < minExpire) {
        minExpire = cookie.expires;
      }
    }
  }
  if (minExpire === null) {
    minExpire = 0;
  }   

  console.log("stored cookie: ", {id: userKey,
    userKey:userKey ,
    cookieData: JSON.stringify(cookies) ,
    expireAt:  Math.floor(minExpire) ,
    createdAt:new Date().toISOString() ,
})

  try{
    const { data: response } = await client.models.kakaoLoginCookie.create({id: userKey,
      userKey:userKey ,
      cookieData: JSON.stringify(cookies) ,
      expireAt: Math.floor(minExpire) ,
      createdAt:new Date().toISOString() ,
  })

  console.log(`쿠키 정보가 DynamoDB(${response?.cookieData})에 저장되었습니다.`);


  } catch (error) {
    console.error('DynamoDB 쓰기 오류:', error);
  }
}

  // DynamoDB에 저장할 때, 필요한 쿠키 데이터만 필터링할 수 있습니다.
  // 여기서는 전체 쿠키를 JSON 문자열로 저장합니다.
  // expireAt은 필수 쿠키 중 가장 빠른 만료 시간을 계산합니다
  async function updateCookiesInDynamo(userKey: string, cookies: Cookie[]): Promise<void> {
    // 필수 쿠키의 expire 값 중 가장 작은 값을 계산 (만료 시간이 있는 쿠키만)
    let minExpire: number | null = null;
    for (const cookie of cookies) {
      if (requiredCookies.includes(cookie.name) && cookie.expires && cookie.expires > 0) {
        if (minExpire === null || cookie.expires < minExpire) {
          minExpire = cookie.expires;
        }
      }
    }
    if (minExpire === null) {
      minExpire = 0;
    }   
  
    console.log("stored cookie: ", {id: userKey,
      userKey:userKey ,
      cookieData: JSON.stringify(cookies) ,
      expireAt:  Math.floor(minExpire) ,
      createdAt:new Date().toISOString() ,
  })
  
    try{
      const { data: response } = await client.models.kakaoLoginCookie.update({id: userKey,
        userKey:userKey ,
        cookieData: JSON.stringify(cookies) ,
        expireAt: Math.floor(minExpire) ,
        createdAt:new Date().toISOString() ,
    })
  
    console.log(`쿠키 정보가 DynamoDB(${response?.cookieData})에 수정되었습니다.`);
  
  
    } catch (error) {
      console.error('DynamoDB 쓰기 오류:', error);
    }
  }

/**
 * Lambda 핸들러
 * Query string 매개변수:
 *   - userId: 사용자 식별자
 *   - userKey: 카카오 앱 키
 *   - userMessage: 전송할 메시지
 */


export const handler: Schema['autoSendServer']["functionHandler"] = async (event) => {
  let browser: Browser | null = null;
  try {
    const { friendName, userKey, userMessage } = event.arguments
    if (!friendName || !userKey || !userMessage) {
      return { statusCode: 400, body: 'friendName, userKey, userMessage 파라미터 필요' };
    }

    // 1. DynamoDB에서 쿠키 정보 조회
    const storedCookies = await getCookiesFromDynamo(userKey);
    console.log(`쿠키 존재 여부: ${storedCookies ? '있음' : '없음'}`);

    // 2. Puppeteer 실행

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath("/opt/nodejs/node_modules/@sparticuz/chromium/bin"),
      headless: chromium.headless,
    });

    let page: Page = await browser.newPage();   
    const targetUrl = `http://${SEND_DEFAULT_URL}?key=${encodeURIComponent(userKey)}&message=${encodeURIComponent(userMessage)}`;
    // 3. 쿠키가 저장되어 있다면, 페이지에 주입
    if (!storedCookies) {
        //저장된 쿠키가 없을때 로그인창 띄움움\
        console.log("저장된 쿠키가 없으므로, non-headless 모드에서 실행하여 사용자 로그인을 유도합니다. target url: ", targetUrl);
  
        // 2. 로그인 페이지로 이동 (실제 로그인 페이지 URL로 교체)
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  
        // 4. sendDefault 호출 후 공유 피커 팝업 창이 뜨기를 대기
        const popupTarget: Target = await browser.waitForTarget((target: Target) => {
          // 메인 페이지의 target(opener)이면 공유 피커 팝업으로 판단 (단, URL이 'data:,'가 아니어야 함)
          return target.opener() === page.target() && target.url() !== 'data:,';
        });
        const popupPage: Page | null = await popupTarget.page();
        if (!popupPage) {
          console.error("팝업 페이지를 찾지 못했습니다.");
          return {
            statusCode: 500,
            body: "팝업 페이지를 찾지 못했습니다.",
          };
        }
        await popupPage.bringToFront();
        console.log('공유 피커 팝업 창 전환 완료');
  
        // 3. DynamoDB에서 사용자 자격증명 조회
        const credentials = await getLoginInfoFromDynamo(userKey);
        if (!credentials) {
          console.error('자격증명을 가져오지 못했습니다.');
          return {
            statusCode: 403,
            body: JSON.stringify('자격증명을 가져오지 못했습니다.'),
          };
        }
        const _id = credentials.userID;
        const _pw = credentials.userPW;
        console.log(`조회된 자격증명: ID=${_id}, PW=${_pw}`);
  
        await popupPage.type('#loginId--1', _id, { delay: 50 });
        await popupPage.type('#password--2', _pw, { delay: 50 });
        
  
        // 4. "간편로그인 정보 저장" 체크박스를 체크하고 값 변경
        await popupPage.click('#saveSignedIn--4', { delay: 10 });

  
        // 5. 로그인 버튼 클릭
        await popupPage.click('button.btn_g.highlight.submit');
  
       // 6. 로그인 후 페이지 전환 또는 에러 메시지 감지를 기다림
        const navigationPromise = popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1000 }).then(() => 'navigated');
        const errorPromise = popupPage.waitForSelector('p.desc_error', { timeout: 1000 }).then(() => 'error');

        const result = await Promise.race([navigationPromise, errorPromise]);

        // 아이디/비밀번호 틀렸을경우
        if (result === 'error') {
          // 에러 메시지가 감지된 경우, 에러 텍스트를 추출하여 로그와 응답으로 반환합니다.
          const errorElement = await popupPage.$('p.desc_error');
          const errorText = await popupPage.evaluate((el:any)=> el.innerText, errorElement);
          console.error('로그인 실패: ' + errorText);
          await browser.close();
          return {
            statusCode: 403,
            body: JSON.stringify('로그인 실패: ' + errorText)
          };
        }
        
        console.log('로그인 및 페이지 전환 완료' , popupPage.url());
        await popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 300000 });

    
        console.log('로그인 및 페이지 전환 완료' , popupPage.url());
        const content = await popupPage.content();
        console.log("페이지 내용:", content);
        // 브라우저의 기본 컨텍스트에서 쿠키를 가져옵니다.
        const allCookies: Cookie[] = await browser!.defaultBrowserContext().cookies();

        // DynamoDB에 쿠키 전송
        storeCookiesInDynamo(userKey, allCookies);     
        
        try {
          await popupPage.waitForSelector('div.unit_chat', { timeout: 500 });
          console.log('메시지 전송 UI가 감지되었습니다.');
          // 이후의 자동화 작업을 여기서 진행합니다.
           // 5. (여기서 sendDefault 호출 후 자동화 작업을 추가할 수 있음)
          const friendListSelector = 'div.unit_chat';
          await popupPage.waitForSelector('div.unit_chat', { timeout: 10000 });
          let friendList = await popupPage.$$(friendListSelector);
          if (friendList.length === 0) {
            console.error("친구 목록을 로드하지 못했습니다. 로그인 상태를 확인하세요.");
            return {
              statusCode: 500,
              body: "친구 목록을 로드하지 못했습니다. 로그인 상태를 확인하세요.",
            };
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
            return {
              statusCode: 500,
              body: `"${friendName}"를 찾지 못했습니다.`,
            };
          }
    
          // 6. "공유하기" 버튼을 찾아 클릭
          const shareButton = await popupPage.waitForSelector('button.btn_commit', { timeout: 5000 });
          if (shareButton) {
            await shareButton.click();
          }
          console.log('공유하기 버튼 클릭 완료');

          await popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });

    
          console.log('로그인 및 페이지 전환 완료' , popupPage.url());
          const content = await popupPage.content();
          console.log("페이지 내용:", content);
        } catch (err) {
          console.error('메시지 전송 UI를 찾지 못했습니다:', err);
          return {
            statusCode: 500,
            body: JSON.stringify('메시지 전송 UI를 찾지 못했습니다.')
          };
        }
                         
      }
      else{              
        await browser.setCookie(...storedCookies);
        console.log("쿠키를 브라우저에 주입했습니다.");

        // 4. sendDefault 전용 페이지로 이동 (userKey, userMessage 전달)        
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
          return {
            statusCode: 500,
            body: "팝업 페이지를 찾지 못했습니다.",
          };
        }
        let content_popup1 = await popupPage.content();
        console.log("팝업 페이지 내용:", content_popup1);
        await popupPage.bringToFront();
        console.log('공유 피커 팝업 창 전환 완료');

        // 5. (여기서 sendDefault 호출 후 자동화 작업을 추가할 수 있음)      
        let friendListSelector = await popupPage.$$('div.unit_chat');
        let loginButton = await popupPage.$$('#saveSignedIn--4');
        let loginEasyExists = await popupPage.$('.login_easy');
        
        // 만약 계정 선택 창이 뜰 경우
        if (loginEasyExists) {

          let content1_1 = await popupPage.content();
          console.log('계정 선택을 위한한 페이지로 전환 완료' , popupPage.url());
          console.log("팝업 페이지 내용2:", content1_1);
          await page.evaluate(() => {
            const firstAccount = document.querySelector('.list_easy li .wrap_profile');
            console.log("first Account: ", firstAccount)
            if (firstAccount instanceof HTMLElement) {
              firstAccount.click();
            }
          });          
        }
          //2차 인증증일때때
        else if(loginButton.length === 0 && friendListSelector.length === 0){               
          let content1 = await popupPage.content();
          console.log('2차 인증을 위한 페이지로 전환 완료' , popupPage.url());
          console.log("팝업 페이지 내용2:", content1);
          await popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 300000 });  
        }
        //로그인부터 다시 시작하는 창이 뜰때때
        else if(loginButton.length > 0){           
          let content1 = await popupPage.content();
          console.log('로그인을 위한 페이지로 전환 완료' , popupPage.url());
          console.log("팝업 페이지 내용2:", content1);
          const credentials = await getLoginInfoFromDynamo(userKey);
          if (!credentials) {
            console.error('자격증명을 가져오지 못했습니다.');
              return {
              statusCode: 403,
              body: JSON.stringify('자격증명을 가져오지 못했습니다.'),
              };
            }
          const _id = credentials.userID;
          const _pw = credentials.userPW;
          console.log(`조회된 자격증명: ID=${_id}, PW=${_pw}`);

        
          try{
            await popupPage.type('#loginId--1', _id, { delay: 50 });
            await popupPage.type('#password--2', _pw, { delay: 50 });
            
      
            // 4. "간편로그인 정보 저장" 체크박스를 체크하고 값 변경
            await popupPage.click('#saveSignedIn--4', { delay: 10 });

      
            // 5. 로그인 버튼 클릭
            await popupPage.click('button.btn_g.highlight.submit', { delay: 10 });
          }
          catch(e){
            console.log("no login element error: ",e )
          }
  
        }

        // 6. 로그인 후 페이지 전환 또는 에러 메시지 감지를 기다림
        // const navigationPromise = popupPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1500 }).then(() => 'navigated');
        
        let submitElements = await popupPage.$$('p.desc_error');

            // 아이디/비밀번호 틀렸을경우
        if (!submitElements) {
          // 에러 메시지가 감지된 경우, 에러 텍스트를 추출하여 로그와 응답으로 반환합니다.
          const errorElement = await popupPage.$('p.desc_error');
          const errorText = await popupPage.evaluate((el:any)=> el.innerText, errorElement);
          console.error('로그인 실패: ' + errorText);
          await browser.close();
          return {
            statusCode: 403,
            body: JSON.stringify('로그인 실패: ' + errorText)
          };
        }
        
  
        let content2 = await popupPage.content();
        console.log("로그인 완료 페이지 내용2:", content2);
        console.log('로그인 완료' , popupPage.url());
        // 브라우저의 기본 컨텍스트에서 쿠키를 가져옵니다.
        
        const allCookies: Cookie[] = await browser!.defaultBrowserContext().cookies();
        const content = await popupPage.content();
        console.log("페이지 내용:", content);
        // DynamoDB에 쿠키 전송
        updateCookiesInDynamo(userKey, allCookies);     
        // 타임아웃 등 에러가 발생한 경우 실행할 대체 작업
        

        await popupPage.waitForSelector('div.unit_chat', { timeout: 1200 });
        let friendList = await popupPage.$$(friendListSelector);
        if (friendList.length === 0) {
          console.error("친구 목록을 로드하지 못했습니다. 로그인 상태를 확인하세요.");
          return {
            statusCode: 500,
            body: "친구 목록을 로드하지 못했습니다. 로그인 상태를 확인하세요.",
          };
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
          return {
            statusCode: 500,
            body: `"${friendName}"를 찾지 못했습니다.`,
          };
        }
  
        // 6. "공유하기" 버튼을 찾아 클릭
        const shareButton = await popupPage.waitForSelector('button.btn_commit', { timeout: 5000 });
        if (shareButton) {
          await shareButton.click();
        }
        console.log('공유하기 버튼 클릭 완료');
      }      
     
      // 결과 확인을 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));         
  
      // 8. 브라우저 종료
      await browser.close();
    } 
    catch (error) {
      console.error("오류 발생:", error);
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
  } 
  return {
    statusCode: 200,
    body: 'Auto share executed successfully',
  };
};
