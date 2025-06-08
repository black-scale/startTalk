import type { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import * as webpush from 'web-push';
import { env } from '$amplify/env/starttalk-sender'; // replace with your function name


  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);


Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>(); 

// webpush.setVapidDetails(
//   'mailto:admin@midnightterrace.com',
//   process.env.VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );


interface TimeItem {
  time: number
  word: string
}

interface KeywordEntry {
  room: string,
  keyword: string
  set_time: TimeItem[]
  receiver: string
  last_send:string
  userKey:string
}

// @ input: message: subscribe 한 메시지, keywordEntry: 조건을 만족하는 keyword entry
// @ output: 메시지에 미리 지정한 알림 시간 내용이 추가된 문자열
function formatMessage(message: string, createdAt: string, keywordEntry: KeywordEntry) {
  let message_to_send = "";
  const date = new Date(createdAt);

  let hours = String(date.getHours()).padStart(2, '0');
  let minutes = String(date.getMinutes()).padStart(2, '0');

  message_to_send += `\n스타트 ${hours}:${minutes}`;
  console.log(keywordEntry.set_time, typeof(keywordEntry.set_time))
  let last_minute = 0;
  keywordEntry.set_time.forEach((time: TimeItem) => {
    date.setMinutes(date.getMinutes() + time.time - last_minute);
    hours = String(date.getHours()).padStart(2, '0');
    minutes = String(date.getMinutes()).padStart(2, '0');
    message_to_send += `/${time.word} ${hours}:${minutes}`;
    last_minute = time.time;
  });

  return message_to_send;
}

async function getSendMode(userKey: string): Promise<String | null> {
  const { data: response } = await client.models.kakaoLoginInfo.get({id: userKey })

  if (!response || !response.sendMode) {
    return null;
  }
  return response.sendMode
}

export const handler = async (event : any) =>{
    console.log("Received DynamoDB Stream event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName === "INSERT") {

      var _room = JSON.stringify(record.dynamodb.NewImage.room.S).replace(/^"|"$/g, '');
      var _message = JSON.stringify(record.dynamodb.NewImage.message.S).replace(/^"|"$/g, '');
      var _createdAt = JSON.stringify(record.dynamodb.NewImage.createdAt.S).replace(/^"|"$/g, '');
      // 원하는 로직 실행 (예: 키워드 필터링, 알림 등)

        if (!_room || !_message) {
          console.error("Missing 'room' or 'message' in arguments.");
          return;
        }

        console.log(_room, _message)

        // 1. 해당 room의 키워드 목록 가져오기
        const { data: keywordItems, errors } = await client.models.KeywordInfo.listKeywordInfoByRoom({room: _room});

        if (errors) {
          console.error("KeywordInfo.list error:", errors);
          return;
        }

        console.log("Keyword infos in the received room: ", keywordItems)
        // 2. keyword가 message에 포함되는 항목만 필터링
        const matchedEntries: KeywordEntry[] = keywordItems
        .filter(item => _message.includes(item.keyword))
        .map(item => {
            let set_time: TimeItem[] = [];        
            if (typeof item.set_time === 'string') {
              try {
                set_time = JSON.parse(item.set_time);
              } catch {
                console.warn('Invalid set_time:', item.set_time);
                set_time = [];
              }
            } 

            return {
              room: item.room,
              keyword: item.keyword,
              set_time: set_time ?? [],
              receiver: item.receiver,
              last_send: new Date().toISOString(),
              userKey: item.userKey
            }

        });

        console.log("Matched infos in the received room: ", matchedEntries)
        // 3. 메시지 포맷팅 및 autosendserver 쿼리 호출
        for (const entry of matchedEntries) {
          const formatted = formatMessage(_message,_createdAt, entry);
          console.log(`Formatted message to send to ${entry.receiver}:\n${formatted}`);

        try {
          const send_mode = await getSendMode(entry.userKey)

          if(send_mode == "auto"){
            const autosendResult = await client.queries.autoSendServer({          
            userKey: entry.userKey,
            userMessage: _message + formatted,
            friendName: entry.receiver
            });
            
            if (autosendResult.errors) {
              console.error("autosendserver query failed:", autosendResult.errors);
              await client.models.startTalkMessageByUser.create({
                keyword: entry.keyword,
                room: entry.room,
                userKey: entry.userKey,
                message: _message,
                additional_message: formatted,
                receiver: entry.receiver,
                timestamp: new Date().toISOString(),
                is_send: false,
                errorMessage:  autosendResult.errors[0].message
              })
            } else {
              console.log("autosendserver sent:", autosendResult.data);
              await client.models.startTalkMessageByUser.create({
                keyword: entry.keyword,
                room: entry.room,
                userKey: entry.userKey,
                message: _message,
                additional_message: formatted,
                receiver: entry.receiver,
                timestamp: new Date().toISOString(),
                is_send: true,
                errorMessage: null
              })
            }
          }                    
          else if(send_mode == "manual"){
            await client.models.startTalkMessageByUser.create({
              keyword: entry.keyword,
              room: entry.room,
              userKey: entry.userKey,
              message: _message,
              additional_message: formatted,
              receiver: entry.receiver,
              timestamp: new Date().toISOString(),
              is_send: false,
              errorMessage: null
            })
          }
        } catch (err) {
          console.error("Exception occurred during autoSendServer call:", err);
             await client.models.startTalkMessageByUser.create({
              keyword: entry.keyword,
              room: entry.room,
              userKey: entry.userKey,
              message: _message,
              additional_message: formatted,
              receiver: entry.receiver,
              timestamp: new Date().toISOString(),
              is_send: false,
              errorMessage:  "카카오톡 전송 실패"
            })
            return {
              statusCode: 404,
              body: "카카오톡 전송 실패",
            };
        }


          
          // userKey로 pushInfo 테이블 조회
          const { data: pushItem } = await client.models.PushInfo.get({id: entry.userKey})

          if (!pushItem) {
            console.log('No push subscriptions found for user:',  entry.userKey);
          }
        //   else{
        //     const keys =  JSON.parse(pushItem.keys)
        //     const subscription = {
        //       endpoint: pushItem.endpoint,
        //       keys: {
        //         p256dh: keys.p256dh,
        //         auth: keys.auth,
        //       }
        //     };


        //     const push_result = await webpush.sendNotification(subscription, JSON.stringify({
        //         title: '📢 StartTalk 알림',
        //         body: "카카오톡 인증을 확인해주세요",
        //       }));
            
        //     console.log("push result: ", push_result)
        //     if (push_result.statusCode === 410 || push_result.statusCode === 404) {
        //       console.log('Subscription expired or invalid. Consider deleting it.', pushItem.id);
        //     } else {
        //       console.error('Push failed:', push_result);
            
        //   }
        // }         
      }
    }
  }

  
  

  return {
    statusCode: 200,
    body: JSON.stringify({message: 'Processed message successfully'
    })
    
  };;
};
