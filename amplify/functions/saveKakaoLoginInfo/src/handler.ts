// amplify/functions/saveKakaoLoginInfo/src/index.ts
import { DynamoDB } from 'aws-sdk'
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../data/resource";

const client = generateClient<Schema>() 


export const handler = async (event: any) => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    }
  }

  const body = JSON.parse(event.body)
  const { userKey, userId, userPw } = body

  const createdAt = new Date().toISOString()
  const expireAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60

  try {
    // 1. 기존 항목 확인
    const { data: existing } = await client.models.kakaoLoginInfo.get({id: userKey })

    // 2. 이미 존재하는 경우 처리
    if (existing) {
      const same = existing.userId === userId && existing.userPw === userPw

      if (same) {
        // ✅ 완전히 같은 항목이면 아무 것도 안 함
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: '동일한 항목이 이미 존재합니다. 저장하지 않음.' }),
        }
      } else {
        // ⚠️ key는 같지만 id/pw가 다르면 업데이트
        const { data: existing } = await client.models.kakaoLoginInfo.update({id: userKey, userId, userPw})

        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: '기존 항목 업데이트 완료',
                                response: existing
           }),
        }
      }
    } else {
      // 신규 항목 저장
      const { data: create } = await client.models.kakaoLoginInfo.create({id: userKey, userId, userPw,createdAt,expireAt})


      return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({ message: '요청 성공' ,
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
