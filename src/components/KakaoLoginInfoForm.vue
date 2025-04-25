<!-- components/KakaoLoginInfoForm.vue -->
<script  lang="ts">
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"
import { mapActions, mapGetters } from 'vuex'
import store from '../store';

const client = generateClient<Schema>()


export default {
  data() {
    return {
      showkey:true,
      showID:true,
      userKey: '' ,
      userId: "",
      userPw: "",
      message:"",     
      loginExpired: -1
    };
  },
  computed:{
    ...mapGetters(['getKey', 'getExpireDate', 'getID'])
    },
  created() {
    // 컴포넌트 생성 시점에 getter로 가져온 값을 localKey에 할당
    this.userKey = this.getKey || ''    
    this.showkey = this.userKey == '' ? true: false;

    this.userID = this.getID||''
    this.showID =  this.userID == '' ? true : false

    this.loginExpired = this.getExpireDate || -1
  },
  methods:{
    ...mapActions(['updateLoginState']),
    async onSubmit ()  {
      if (!this.userKey || !this.userId|| this.userPw === null) {
        this.message = '모든 값을 입력해주세요.'
        return
      }
      this.login();
    },
    async login(){
      try {        
          const result = await client.queries.saveKakaoLoginInfo({
            userKey: this.userKey,
              userId: this.userId,
              userPw: this.userPw,
          })
          const parsed = JSON.parse(result.data.toString())

          // 로그인/ 비밀번호 변경 성공 시 재로그인 시도도
          if(parsed.statusCode == 200 || parsed.statusCode == 201){
            const loginresult = await client.queries.autoSendServer({
                userKey: this.userKey,
                userMessage: '스타트톡 로그인 완료',
                friendName: 'send_myself',
            })

            const loginparsed = JSON.parse(loginresult.data.toString())
            if(loginparsed.statusCode == 200){
              store.dispatch('messageModel/initSubscription');
              const body_parsed = JSON.parse(loginparsed.body.toString())
              const expire = body_parsed.cookieExpiredAt? body_parsed.cookieExpiredAt : -1
              const id =  body_parsed.kakaoID?  body_parsed.kakaoID : this.userId
              this.updateLoginState({expiredAt:expire,kakaoID:id})
              alert("로그인 완료")
              this.showKey = false;
              this.showID = false;
            }
            else if(parsed.statusCode == 202){
              alert(loginparsed.body)
            }
            else{
              alert(loginparsed.body)
              store.dispatch('messageModel/stopSubscription');
            }

          }
          else{
            alert(parsed.body)
            store.dispatch('messageModel/stopSubscription');
          }

        } catch (error) {
          console.error('Lambda 호출 실패:', error)
          this.message = '저장 실패'
        }
      
      console.log(this.message)
    
    },
    async reLogin(){

      //쿠키 삭제
      if(!this.userKey || this.expiredAt){
          return;
      }
      const result = await client.models.kakaoLoginCookie.delete({id: this.userKey})
      
      // 로그인 
      const loginresult = await client.queries.autoSendServer({
        userKey: this.userKey,
        userMessage: '스타트톡 로그인 완료',
        friendName: 'send_myself',
      })

      const loginparsed = JSON.parse(loginresult.data.toString())
      if(loginparsed.statusCode == 200){
        store.dispatch('messageModel/initSubscription');
        const body_parsed = JSON.parse(loginparsed.body.toString())
        const expire = body_parsed.cookieExpiredAt? body_parsed.cookieExpiredAt : -1
        const id =  body_parsed.kakaoID?  body_parsed.kakaoID : ""
        this.updateLoginState({expiredAt:expire,kakaoID: id})
        alert("재로그인 완료")
        this.showKey = false;
        this.showID = false;
      }
      else{
        alert("재로그인 실패: " + loginparsed.body)
        store.dispatch('messageModel/stopSubscription');
      }
    },
    async logout(){
      const deleteCookieResult = await client.models.kakaoLoginCookie.delete({id: this.userKey})
      const loginResult = await client.models.kakaoLoginInfo.delete({id: this.userKey})
      this.showKey = true;
      this.showID = true;
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
        <input v-if="showkey" v-model="userKey" type="text" placeholder="User Key" class="border p-2 w-full mb-4" />
        <input v-if="showID" v-model="userId" type="text" placeholder="Kakao ID" class="border p-2 w-full mb-4" />
        <h2 v-if="!showID" class="text-lg font-bold">
            {{userId}} 
          </h2>
        <input v-model="userPw" type="password" placeholder="Kakao PW" class="border p-2 w-full mb-4" />
        <div class="w-full flex">
          <button v-if="loginExpired != -1" onclick="reLogin()" class="bg-blue-500 text-white px-4 py-2 rounded w-full">재로그인</button>
          <button v-if="loginExpired != -1" onclick="logout()" class="bg-blue-500 text-white px-4 py-2 rounded w-full">로그아웃</button>
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">저장</button>
        </div>
        <p v-if="loginExpired != -1">로그인 유효 기간: {{loginExpired}}</p>

      </form>
    </div>
  </div>
</template>
