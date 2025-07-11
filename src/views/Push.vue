<template>
  <div class="p-4 max-w-md mx-auto space-y-4">
    <h2 class="text-xl font-bold">📤 푸시 알림 테스트</h2>

    <div class="space-y-2">
      <input
        v-model="title"
        type="text"
        placeholder="제목 입력"
        class="w-full p-2 border rounded"
      />
      <input
        v-model="body"
        placeholder="내용 입력"
        class="w-full p-2 border rounded" 
        />
    </div>

    <button @click="sendPushNotification" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      알림 보내기
    </button>
  </div>
</template>

<script lang="ts">

import * as webpush from 'web-push'

// ✅ 환경변수 또는 .env에 설정
const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = import.meta.env.VITE_APP_VAPID_PRIVATE_KEY!

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

/**
 * @param subscriptionInfo: DB에서 불러온 pushInfo 객체
 * @param message: 전송할 메시지
 */

export default {
  data(){
    return{
      title: "",
      body:""
    }
  },
  methods: {
    async sendPushNotification() {
      
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.getSubscription();

      const payload = JSON.stringify({
        title: this.title,
        body: this.body
      })

      try {
        await webpush.sendNotification(subscription, payload)
        console.log(`✅ 알림 전송 완료`)
      } catch (err) {
        console.error(`❌ 알림 전송 실패:`, err)
      }
    }
  }
};
</script>
