<!-- components/KakaoLoginInfoForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['close'])

const userKey = ref('')
const userId = ref('')
const userPw = ref<number | null>(null)
const message = ref('')

async function onSubmit() {
  if (!userKey.value || !userId.value || userPw.value === null) {
    message.value = '모든 값을 입력해주세요.'
    return
  }

  try {
    const response = await fetch('/functions/saveKakaoLoginInfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey: userKey.value,
        userId: userId.value,
        userPw: userPw.value,
      }),
    })

    const result = await response.json()
    message.value = '✅ 저장 성공: ' + JSON.stringify(result)
  } catch (error) {
    console.error('Lambda 호출 실패:', error)
    message.value = '저장 실패'
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <button
        class="absolute top-2 right-2 text-gray-600 hover:text-black"
        @click="emit('close')"
      >
        ✖
      </button>
      <h2 class="text-xl font-bold mb-4">카카오 로그인 정보 입력</h2>
      <form @submit.prevent="onSubmit">
        <input v-model="userKey" placeholder="User Key" class="w-full border p-2 mb-2" />
        <input v-model="userId" placeholder="Kakao ID" class="w-full border p-2 mb-2" />
        <input v-model.number="userPw" type="number" placeholder="Kakao PW" class="w-full border p-2 mb-2" />
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">저장</button>
      </form>
      <p class="mt-4 text-sm text-gray-700">{{ message }}</p>
    </div>
  </div>
</template>
