<template>
  <div>
    <h2>실시간 메시지</h2>
    <ul>
      <li v-for="(message, index) in messages" :key="message.id">
        {{ message.content }} <small>({{ message.createdAt }})</small>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { Schema } from "../../amplify/data/resource"
import { generateClient } from 'aws-amplify/data';
const  client = generateClient<Schema>();

export default {
  data() {
    return {
      messages: [] as Array<any>,
      subscription: null,
    }
  },
  mounted() {
    this.subscription = client.models.startTalkMessage.onCreate().subscribe({
      next: ( data ) => {
          // result가 null이 아닌지 먼저 확인
        if (!data) return;
        
        // result의 데이터에서 updatedAt 필드를 제외합니다.
        const { updatedAt, ...filteredData } = data;
        console.log('새 메시지 수신:', filteredData);
        this.messages = [filteredData];
      },
      error: (error) => console.warn('Subscription error:', error)
    });
  },
  beforeUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  },
}
</script>

<style scoped>
/* 필요한 스타일을 추가하세요 */
</style>
