// amplify/functions/saveKakaoLoginInfo/src/index.ts

import type { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/save-kakao-login-info'; // replace with your function name


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>() 


export const handler: Schema['saveKakaoLoginInfo']["functionHandler"] = async (event) =>{

  const { userKey, userId, userPw, subscription } = event.arguments

  if(!userKey || !userId || !userPw){
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'key, id, pw 정보가 없습니다. . 저장하지 않음.' }),
    }
  }

  const createdAt = new Date().toISOString()
  const expireAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
  const defaultSendMode = "Manual"

  try {
    // 1. 기존 항목 확인
    const { data: existing } = await client.models.kakaoLoginInfo.get({id: userKey })

    // 2. 이미 존재하는 경우 처리
    if (existing) {
      const same = existing.userId === userId && existing.userPw === userPw
      storePushSubscription(userKey, subscription);
      if (same) {
        // ✅ 완전히 같은 항목이면 아무 것도 안 함
        return {
          statusCode: 202,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ body: '동일한 항목이 이미 존재합니다. 저장하지 않음.' }),
        }
      } else {
        // ⚠️ key는 같지만 id/pw가 다르면 업데이트
        
        const { data: existing } = await client.models.kakaoLoginInfo.update({id: userKey, userKey, userId, userPw})

        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ body: '기존 항목 업데이트 완료',
                                response: existing
           }),
        }
      }
    } else {
      // 신규 항목 저장
      let sendMode = defaultSendMode
      const { data: create } = await client.models.kakaoLoginInfo.create({id: userKey, userKey, userId, userPw,createdAt,expireAt,sendMode})

      storePushSubscription(userKey, subscription);
      return {
        statusCode: 201 ,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ body: '요청 성공' ,
                                response: create
        }),
      }
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': 'http://localhost:5173' },
      body: JSON.stringify({ message: '오류 발생', error }),
    }
  }
}

async function storePushSubscription(userKey: string, subscription: any) {
  if (!subscription) {
    console.log("subscription 없음. pushInfo 저장 생략");
    return;
  }

  try {
    const parsed = typeof subscription === 'string'
      ? JSON.parse(subscription)
      : subscription;

    const endpoint = parsed.endpoint;
    const keys = JSON.stringify(parsed.keys);

    if (!endpoint || !parsed.keys?.p256dh || !parsed.keys?.auth) {
      console.warn("PushSubscription 구조가 올바르지 않음");
      return;
    }

    // ✅ deviceId: endpoint 기반으로 유일하게 생성 (또는 클라이언트에서 UUID 보내도 됨)
    const deviceId = `${userKey}-${btoa(endpoint).slice(0, 12)}`; // 고유하게 만듦

    const now = new Date().toISOString();

    try {
      await client.models.PushInfo.create({
        userKey,
        deviceId,
        endpoint,
        keys,
      });
      console.log(`PushInfo 생성 완료: ${deviceId}`);
    } catch (createErr: any) {
      console.warn(`PushInfo 이미 존재함. 업데이트 시도: ${createErr?.message || createErr}`);
      await client.models.PushInfo.update({
        userKey,
        deviceId,
        endpoint,
        keys,
      });
      console.log(`PushInfo 업데이트 완료: ${deviceId}`);
    }
  } catch (e) {
    console.error("PushInfo 저장 중 에러", e);
  }
}