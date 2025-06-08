<!-- components/KakaoLoginInfoForm.vue -->


<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <button
        class="absolute top-2 right-2 text-gray-600 hover:text-black"
        @click="$emit('close')"
      >
        ✖
      </button>
      <h2 class="text-xl font-bold mb-4 text-black">카카오 로그인 정보 입력</h2>
      <form @submit.prevent="onSubmit()">
        <input v-if="showkey" v-model="userKey" type="text" placeholder="User Key" class="text-black border p-2 w-full mb-4" />
        <input v-if="showID" v-model="userId" type="text" placeholder="Kakao ID" class="text-black border p-2 w-full mb-4" />
        <h2 v-if="!showID" class="text-lg font-bold text-black">
           ID: {{getID}} 
          </h2>
        <input v-model="userPw" type="password" placeholder="Kakao PW" class="border p-2 w-full mb-4 text-black" />
        <div class="w-full flex">
          <button v-if="loginExpired != -1" @click="reLogin()" class="bg-blue-500 text-white px-4 py-2 rounded w-full">재로그인</button>
          <button v-if="loginExpired != -1" @click="logout()" class="bg-blue-500 text-white px-4 py-2 rounded w-full">로그아웃</button>
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded w-full">저장</button>
        </div>
        <p class="text-black" v-if="isSetLoginInfo">로그인 중입니다.</p>
        <p class="text-black" v-if="isLoggingIn">로그인 중입니다. 모바일 카카오톡 인증 요청을 확인해주세요.</p>
        <p class="text-black" v-if="loginExpired != -1">로그인 유효 기간: {{loginExpiredString}}</p>
      </form>
      <LoginTimeoutConfirmModal v-if="showLoginConfirm" :user-key="userKey" @login-success="handleLoginSuccess" @close="handleLoginClose" /> 
      
    </div>
  </div>
</template>

<script  lang="ts">
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"
import { mapActions, mapGetters } from 'vuex'
import LoginTimeoutConfirmModal from "./LoginTimeoutConfirmModal.vue";
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
      isLoggingIn: false,
      isSetLoginInfo: false,
      loginExpired: -1,
      loginExpiredString: "",
      showLoginConfirm:false
    };
  },
  emits: ['close','logout'],
  components:{
    LoginTimeoutConfirmModal
  },
  
  computed:{
    ...mapGetters(['getKey', 'getExpireDate', 'getID'])
    },
  async created() {
    // 컴포넌트 생성 시점에 getter로 가져온 값을 localKey에 할당
    this.userKey = this.getKey || ''    
    this.showkey = this.userKey == '' ? true: false;

    this.userID = this.getID||''
    this.showID =  this.userID == '' ? true : false

    this.loginExpired = this.getExpireDate || -1

    if(this.userID && this.userKey &&this.loginExpired > 0){
      const date = new Date(this.loginExpired * 1000);
      this.loginExpiredString = date.toISOString().replace('T', ' ').substring(0, 19);
    }

   if(this.userKey && !this.userID){
       const result = await client.models.kakaoLoginInfo.list({
           filter:{ userKey : {eq:this.userKey}}
        })
        if(result.data){
          this.userID = result.data[0].userId
        }
    }

    if(this.userID && this.userKey && this.loginExpired < 0){
      const result = await client.models.kakaoLoginCookie.get({
          id: this.userKey
      })
      this.loginExpired = result.data.expireAt
      const date = new Date(this.loginExpired * 1000);
      this.loginExpiredString = date.toISOString().replace('T', ' ').substring(0, 19);
    }

    
  },
  methods:{
    ...mapActions(['updateLoginState','updateRoom','updateKey']),
    async onSubmit ()  {
      if (!this.userKey || !this.userId|| this.userPw === null) {
        this.message = '모든 값을 입력해주세요.'
        return
      }
      this.login();
    },
    async login(){
      try {  
        this.isSetLoginInfo = true      
        let idtoLogin = this.userId  
        if(!this.showID){
          idtoLogin = this.getID
          }
          const result = await client.queries.saveKakaoLoginInfo({
              userKey: this.userKey,
              userId: idtoLogin,
              userPw: this.userPw,
          })
          const parsed = JSON.parse(result.data.toString())
          this.isSetLoginInfo = false
          // 로그인/ 비밀번호 변경 성공 시 재로그인 시도도
          if(parsed.statusCode == 200 || parsed.statusCode == 201){
            alert("로그인 정보 등록 완료")
            this.showKey = false;
            this.showID = false;
            this.updateLoginState({expiredAt:-1,kakaoID: this.userId})
            this.$emit('close')
          }
          else if(parsed.statusCode == 202){
            alert(parsed.body)
          }
          else{
            alert(parsed.body)
            store.dispatch('messageModel/stopSubscription');
          }

        }


        catch (error) {
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
      this.updateLoginState({expiredAt:-1,kakaoID:""})
      
      this.isLoggingIn = true
      // 로그인 
      const loginresult = await client.queries.autoSendServer({
        userKey: this.userKey,
        userMessage: '스타트톡 로그인 완료',
        friendName: 'send_myself',
      })
      this.isLoggingIn = false

      //Timeout으로 null data 왔을때(Appsync는 30초 제한 ㅠ)
      if(!loginresult.data){
        if(loginresult.errors[0].errorType == "Lambda:ExecutionTimeoutException"){
          this.showLoginConfirm = true
        }
      }
      else{
        //정상 응답 왔을때
        const loginparsed = JSON.parse(loginresult.data.toString()) 
        if(loginparsed.statusCode == 200){
          store.dispatch('messageModel/initSubscription');
          const body_parsed = JSON.parse(loginparsed.body.toString())
          const expire = body_parsed.cookieExpiredAt? body_parsed.cookieExpiredAt : -1
          const id =  body_parsed.kakaoID?  body_parsed.kakaoID : ""
          this.updateLoginState({expiredAt:expire,kakaoID: id})
          this.updateKey(this.userKey)
          const date = new Date(expire * 1000);
          this.loginExpiredString = date.toISOString().replace('T', ' ').substring(0, 19);
          alert("재로그인 완료")
          this.showKey = false;
          this.showID = false;        
        }
        else{
          alert("재로그인 실패: " + loginparsed.body)
          this.logout();
          store.dispatch('messageModel/stopSubscription');
        }
      }    
    },
    async logout(){
      const deleteCookieResult = await client.models.kakaoLoginCookie.delete({id: this.userKey})
      const loginResult = await client.models.kakaoLoginInfo.delete({id: this.userKey})
      this.updateLoginState({expiredAt:-1,kakaoID:""})
      this.updateRoom({newRoom:"",newRegion:"", newDisplay:""})
      this.showKey = true;
      this.showID = true;
      this.loginExpired = -1
      this.$emit('logout')
    },
    handleLoginSuccess(payload: { expiredAt: number; kakaoID: string }) {
      console.log(payload)
      this.loginExpired = payload.expiredAt
      if(this.loginExpired > 0){
        const date = new Date(payload.expiredAt * 1000);
        this.loginExpiredString = date.toISOString().replace('T', ' ').substring(0, 19);
        alert("재로그인 완료")
      }
      if(payload.kakaoID){
        this.showID = false
      }
      this.showLoginConfirm=false
    },
    handleLoginClose(){
      this.showLoginConfirm = false
    }
  },

};



</script>

