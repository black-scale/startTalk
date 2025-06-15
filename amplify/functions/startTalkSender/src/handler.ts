import type { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
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

const startTriggers = ['ㅅ', 'ㅅㅌㅌ', 'ㅅㅅ', 'ㅆ'];
const endTriggers = ['ㄲ', '끝'];
const extendTriggers = ['ㅇㅈ'];
const correctionTriggers = ['ㅈㅈ'];

function getName(message: string){
    // 한글 자모로 이루어진 접두사 제거 (ex: ㅈㅈ, ㅅㅅ, ㅂㅂ, ㅇㅈ 등)
  const cleaned = message.replace(/^[ㄱ-ㅎㅏ-ㅣ]+/, '').trim();

  // cleaned 문자열의 시작에서 "숫자 + 한글 단어" 탐지
  const match = cleaned.match(/^(\d{2,3})\s*([가-힣]+)/);
  if (match) {
    return  `${match[1]} ${match[2]}` 
  }

  return "";
}

async function client_getStart(keyword: string, userKey: string,room:string){
  // userKey를 받아 keyword가 포함된 최근 메시지를 리턴턴
  // "103 정훈 키워드드 ㅆ \n 스타트 00:51/완티 01:01/만시 01:22"
    // 1. 해당 userKey로 메시지 조회
  const { data: messages, errors } = await client.models.startTalkMessageByUser.list({
    filter: {
      userKey: { eq: userKey },
      room : {eq: room}
    }
  });

  if (errors || !messages) {
    console.error("DynamoDB fetch error:", errors);
    return null;
  }

  // 2. keyword + startTrigger 포함된 메시지 필터링
  const filtered = messages.filter(entry => {
    const content = (entry.message ?? "").replace(/\s/g, '');
    return  content.includes(keyword) &&
              startTriggers.some(trigger => content.includes(trigger));
  });

  if (filtered.length === 0) return null;

  // 3. timestamp 기준으로 최신 항목 선택
  const latest = filtered.sort((a, b) =>
    new Date(b.timestamp ?? '').getTime() - new Date(a.timestamp ?? '').getTime()
  )[0];

  return latest.timestamp ?? null;

  return "2025-06-13T00:51:25.078Z"

}

// @ input: message: subscribe 한 메시지, keywordEntry: 조건을 만족하는 keyword entry
// @ output: 메시지에 미리 지정한 알림 시간 내용이 추가된 문자열
async function formatMessage(message: string, createdAt: string, keywordEntry: KeywordEntry)  : Promise<string> {
  let message_to_send = "";
  const date = new Date(createdAt);

  let hours = String(date.getHours()).padStart(2, '0');
  let minutes = String(date.getMinutes()).padStart(2, '0');

  // 1. 메시지 타입 검출
  
  const hasStart = startTriggers.some(trigger => message.includes(trigger));
  const hasEnd = endTriggers.some(trigger => message.includes(trigger));
  const hasExtend = extendTriggers.some(trigger => message.includes(trigger));
  const hasCorrection = correctionTriggers.some(trigger => message.includes(trigger));

  //2. 정정
  //주의 사항: (1~2자리 숫자)시(1~2자리 숫자) 를 감지하기 때문에, 혹시 시간 이외의 자리에 해당 포맷의 내용이 있을 시 파싱이 부정확해질 수 있음음
  if(hasCorrection){
    // 2-1. 정정 처리: ㅈㅈ 제거 후 재파싱
    const cleaned_trigger = message.replace(/ㅈㅈ/g, '');
    const timeMatch = message.match(/(\d{1,2})시(\d{1,2})/);
    if (!timeMatch) return "시간 정보가 잘못되었습니다";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hour = String(parseInt(timeMatch[1])).padStart(2, '0');
    const minute = String(parseInt(timeMatch[2])).padStart(2, '0');

    // ISO 형식으로 조합
    const createdAt_parsed = `${year}-${month}-${day}T${hour}:${minute}:00`;
    const cleanedMessage = cleaned_trigger.replace(timeMatch[0], '');
    return formatMessage(cleanedMessage, createdAt_parsed, keywordEntry);
  }
  //3. 시작
  if(hasStart){
    message_to_send += `\n스타트 ${hours}:${minutes}`;
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

  //4. 끝
  if(hasEnd){
    const rawMessage = message
    const normalized = rawMessage.replace(/\s/g, '');

    // 4-1. 직접 감지: "혜주2ㄲ", "혜주ㄲ"
    for (const trigger of endTriggers) {
        const regex = new RegExp(`${keywordEntry.keyword}(\\d*)${trigger}`);
        const match = normalized.match(regex);
        if (match) {
        const number = match[1] || '';
        //number '' 일시 시간만 저장하고 나중에 끝 올수도 있음
        const msg = `\n${keywordEntry.keyword} ${number}끝`;
        return msg;
        }
    }

    // 4-2. 키워드는 포함되어 있고, 숫자+끝만 나오는 경우: "혜주 혜지 2ㄲ"
    // 2. 키워드가 있고, 그 이후에 숫자+끝이 존재하면 감지
    if (normalized.includes(keywordEntry.keyword)) {
        const keywordIndex = normalized.lastIndexOf(keywordEntry.keyword);
        const pattern = new RegExp(`(\\d*)(${endTriggers.join('|')})`, 'g');

        let match: RegExpExecArray | null;
        let selectedMatch: RegExpExecArray | null = null;

        while ((match = pattern.exec(normalized)) !== null) {
            if (match.index > keywordIndex) {
                selectedMatch = match;
                break;
            }
        }

        if (selectedMatch) {
            const number = selectedMatch[1] || '';
            const msg = `\n${keywordEntry.keyword} ${number}끝`;
            return msg;
        }
    }
    return "\n끝 - 파싱 실패"
  }
  //5. 연장장
  if(hasExtend){
    const startTimeStr = await client_getStart(keywordEntry.keyword, keywordEntry.userKey, keywordEntry.room)
    if(!startTimeStr){
      return "연장 대상 스타트 메시지를 찾을 수 없습니다"
    }
    const originalStart = new Date(startTimeStr);

    const rawMessage = message
    const normalized = rawMessage.replace(/\s/g, '');
    let multiplier : (number | null)  = null

    // 4-1. 직접 감지: "혜주 2ㅇㅈ", "혜주 ㅇㅈㅈ"
    for (const trigger of extendTriggers) {
        const regex = new RegExp(`${keywordEntry.keyword}(\\d*)${trigger}`);
        const match = normalized.match(regex);
        if (match) {
          multiplier = parseInt(match[1]) || 1;
          break;
        }
    }

    // 4-2. 키워드는 포함되어 있고, 숫자+끝만 나오는 경우: "혜주 혜지 2ㄲ"
    // 2. 키워드가 있고, 그 이후에 숫자+끝이 존재하면 감지
    if (!multiplier && normalized.includes(keywordEntry.keyword)) {
        const keywordIndex = normalized.lastIndexOf(keywordEntry.keyword);
        const pattern = new RegExp(`(\\d*)(${extendTriggers.join('|')})`, 'g');

        let match: RegExpExecArray | null;
        let selectedMatch: RegExpExecArray | null = null;

        while ((match = pattern.exec(normalized)) !== null) {
            if (match.index > keywordIndex) {
                selectedMatch = match;
                break;
            }
        }

        if (selectedMatch) {
            multiplier = parseInt(selectedMatch[1]) || 1;
        }
    }

    if(!multiplier){
      return "연장 대상 키워드를 찾을 수 없습니다"
    }

    // 제일 긴 시간 찾기
    const longestTime = keywordEntry.set_time.reduce((max, item) => Math.max(max, item.time), 0);

    // 새로운 스타트 시간 = 원래 스타트 + (제일 긴 시간 × multiplier)
    const newStart = new Date(originalStart);
    newStart.setMinutes(newStart.getMinutes() + longestTime * multiplier);

    // 메시지 작성
    let message_to_send = ` ${multiplier}연장 \n`;

    const hh = String(newStart.getHours()).padStart(2, '0');
    const mm = String(newStart.getMinutes()).padStart(2, '0');
    message_to_send += `${hh}${mm}스타트`;

    for (const item of keywordEntry.set_time) {
      const t = new Date(newStart);
      t.setMinutes(t.getMinutes() + item.time);
      const h = String(t.getHours()).padStart(2, '0');
      const m = String(t.getMinutes()).padStart(2, '0');
      message_to_send += ` ${h}${m}${item.word}`;
    }

    return message_to_send;
  }

  return "해당하는 메시지의 포맷을 찾을 수 없습니다"
 
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
        // 3. 메시지 포맷팅 
        for (const entry of matchedEntries) {
          const formatted = await formatMessage(_message,_createdAt, entry);
          const message_to_send = getName(_message) + formatted
          console.log(`Formatted message to send to ${entry.receiver}:\n${message_to_send}`);

        // autosendserver 쿼리 호출
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
                additional_message: message_to_send,
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
                additional_message: message_to_send,
                receiver: entry.receiver,
                timestamp: new Date().toISOString(),
                is_send: true,
                errorMessage: null
              })

              await client.models.KeywordInfo.update({
                keyword: entry.keyword,
                room : entry.room,
                userKey: entry.userKey,
                last_send : new Date().toISOString()
              })
            }
          }                    
          else if(send_mode == "manual"){
            await client.models.startTalkMessageByUser.create({
              keyword: entry.keyword,
              room: entry.room,
              userKey: entry.userKey,
              message: _message,
              additional_message: message_to_send,
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
              additional_message: message_to_send,
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
