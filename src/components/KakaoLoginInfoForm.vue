<!-- components/KakaoLoginInfoForm.vue -->
<script  lang="ts">
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"
import { mapActions, mapGetters } from 'vuex'

const client = generateClient<Schema>()


export default {
  data() {
    return {
      userKey: '' ,
      userId: "",
      userPw: "",
      message:"",     
    };
  },
  computed:{
    ...mapGetters(['getKey'])
  },
  created() {
    // 컴포넌트 생성 시점에 getter로 가져온 값을 localKey에 할당
    this.userKey = this.getKey || ''    
  },
  methods:{
    async onSubmit ()  {
      if (!this.userKey || !this.userId|| this.userPw === null) {
        this.message = '모든 값을 입력해주세요.'
        return
      }

      try {
        
        client.queries.saveKakaoLoginInfo({
           userKey: this.userKey,
            userId: this.userId,
            userPw: this.userPw,
        })
       
      } catch (error) {
        console.error('Lambda 호출 실패:', error)
        this.message = '저장 실패'
      }
    
    console.log(this.message)
    }
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
        <input v-if="!userKey" v-model="userKey" type="text" placeholder="User Key" class="border p-2 w-full mb-4" />
        <input v-model="userId" type="text" placeholder="Kakao ID" class="border p-2 w-full mb-4" />
        <input v-model="userPw" type="password" placeholder="Kakao PW" class="border p-2 w-full mb-4" />
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">저장</button>
      </form>
    </div>
  </div>
</template>
