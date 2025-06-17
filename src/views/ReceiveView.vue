<template>
  
  
 <div class="fixed top-0 left-1/2 transform -translate-x-1/2  w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
  <MainHeader />  
  <h1>정보 수신 설정</h1>

    <p v-if="loading">현재 수신 상태를 확인 중입니다...</p>

    <div v-else>
      <p>
        현재 수신 상태:
        <strong>{{ isUnsubscribed ? "수신 거부됨" : "수신 동의 중" }}</strong>
      </p>

      <button @click="toggleSubscription">
        {{ isUnsubscribed ? "수신 재개하기" : "수신 거부하기" }}
      </button>

      <p v-if="message">{{ message }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { generateClient } from "aws-amplify/api"
import type { Schema } from '../../amplify/data/resource'
import { useRoute } from 'vue-router';
import MainHeader from '../components/MainHeader.vue';

const client = generateClient<Schema>()

export default {
  data() {
    return {
      loading: true,
      isUnsubscribed: false,
      message: "",
      id: "",
      receiver: ""
    };
  },
  created() {
    const route = useRoute();
    this.id = route.query.id;
    this.receiver = route.query.receiver;

    this.checkSubscriptionStatus();
  },
  components: {
    MainHeader
  },
  methods: {
    async checkSubscriptionStatus() {
      this.loading = true;
      try {
        const { data } = await client.models.UnsubscribeInfo.list({
          filter: {
            userId: { eq: this.id },
            receiver: { eq: this.receiver }
          }
        });
        this.isUnsubscribed = data.length > 0;
      } catch (err) {
        console.error("수신 상태 확인 실패:", err);
        this.message = "수신 상태를 확인할 수 없습니다.";
      } finally {
        this.loading = false;
      }
    },
    async toggleSubscription() {
      this.loading = true;
      this.message = "";
      try {
        if (this.isUnsubscribed) {
          await client.models.UnsubscribeInfo.delete({ userId: this.id, receiver: this.receiver });
          this.isUnsubscribed = false;
          this.message = "수신이 재개되었습니다.";
        } else {
          await client.models.UnsubscribeInfo.create({ userId: this.id, receiver: this.receiver, unsubscribedAt: Math.floor(Date.now() / 1000) as any });
          this.isUnsubscribed = true;
          this.message = "수신이 거부되었습니다.";
        }
      } catch (err) {
        console.error("전환 실패:", err);
        this.message = "처리 중 오류가 발생했습니다.";
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
