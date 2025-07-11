import type { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/push-sender'; // replace with your function name
import * as webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>() 


export const handler = async (event : any) =>{

    const { userKey, deviceId, title, body } = event.arguments
    const result = await client.models.PushInfo.get({userKey, deviceId})
    const endpoint = result.data?.endpoint  || "" 
    const keys = result.data?.keys || "{}"

    console.log(endpoint, keys)
    const subscription = {
        endpoint: endpoint,
        expirationTime: null,
        keys: JSON.parse(keys) // 🔐 keys는 JSON string으로 저장되었다고 가정
    };

    console.log(subscription)

    try {
        await webpush.sendNotification(
        subscription,
        JSON.stringify({
            title: title,
            body: body,
        })
    );

    return { success: true };
  } catch (err) {
    console.error("푸시 전송 실패:", err);
    return { success: false, error: err };
  }
}