<!-- components/KakaoLoginInfoForm.vue -->
<script  lang="ts">
import { ref } from 'vue'
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"

const client = generateClient<Schema>()

export default {
  setup(props) {
    const userKey = ref('')
    const userId = ref('')
    const userPw = ref('')
    let message = ref('')
    const onSubmit = async () => {
      if (!userKey.value || !userId.value || userPw.value === null) {
        message.value = '모든 값을 입력해주세요.'
        return
      }

      try {
        
        client.queries.saveKakaoLoginInfo({
           userKey: userKey.value,
            userId: userId.value,
            userPw: userPw.value,
        })
       
      } catch (error) {
        console.error('Lambda 호출 실패:', error)
        message.value = '저장 실패'
      }
    };
    console.log(message.value)
    return { userKey, userId, userPw, onSubmit };
  }
};



</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <button
        class="absolute top-2 right-2 text-gray-600 hover:text-black"
        @click="$emit('close')"
      >
        ✖
      </button>
      <h2 class="text-xl font-bold mb-4">카카오 로그인 정보 입력</h2>
      <form @submit.prevent="onSubmit">
        <input v-model="userKey" type="text" placeholder="User Key" class="border p-2 w-full mb-4" />
        <input v-model="userId" type="text" placeholder="Kakao ID" class="border p-2 w-full mb-4" />
        <input v-model="userPw" type="password" placeholder="Kakao PW" class="border p-2 w-full mb-4" />
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">저장</button>
      </form>
    </div>
  </div>
</template>
