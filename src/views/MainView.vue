<template>
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2  w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <MainHeader
      :show-kakao-login-form="showKakaoLoginForm"
      :kakao-api-key="kakaoApiKey"
      @open-kakao-form="handleOpenForm"
      @close-kakao-form="handleCloseForm"
    />
    <div class="p-4">
      <div v-if="!isLoggedIn" class="mb-4">
        <h2 class="text-lg font-bold">(1/2) 스타트톡을 사용하려면 카카오톡으로 로그인 해보세요</h2>
        <input type="text" id="apiKey" v-model="kakaoApiKey" placeholder="Enter your Kakao API key" />
        <button @click="kakaoInitialize" class="mt-2 w-full bg-yellow-500 text-white py-2 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none">
          카카오톡 로그인
        </button>
      </div>
      <div v-if="isWatingLoggedIn" class="mb-4">
        <h2 class="text-lg font-bold">서버에 로그인 중입니다</h2>
      </div>
      <!-- 만약 appsync에서 null 리턴 했을때 -->
      <LoginTimeoutConfirmModal v-if="showLoginConfirm" :user-key="kakaoApiKey"    @login-success="handleLoginSuccess" @close="handleLoginClose" /> 
      <!-- 선택된 채팅방이 있을 때 -->
      <div v-if="isChatRootSelected && isLoggedIn" class="flex items-center justify-between p-4 bg-blue-200 rounded-lg">
        <div class="flex items-center space-x-4">
          <h2 class="text-lg font-bold">
            {{ selectedChatRoom.region }} {{ selectedChatRoom.display_name }}
          </h2>
          <button 
            @click="removeChatRoom" 
            class="px-4 py-2 bg-yellow-200 text-brown-500 font-medium rounded hover:bg-yellow-300 transition">
            변경
          </button>
        </div>
        <button 
          @click="setting" 
          class="p-2 focus:outline-none bg-white rounded-full shadow hover:bg-gray-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
          </svg>
        </button>        
      </div>
      <!-- 선택된 채팅방이 없을 때 버튼 노출 -->
      <div v-if="!isChatRootSelected">
        <h2 class="text-lg font-bold">(2/2) 스타트톡 사용을 할 채팅방을 골라보세요</h2>
          <button @click="openChatRoom" class="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg shadow-md hover:bg-green-600 focus:outline-none">
            채팅방 선택
          </button>
      </div>   

      <!-- 모두 선택됐을 때 메뉴 바 노출 -->
      <div v-if="isChatRootSelected && isLoggedIn" class="flex overflow-x-auto space-x-4 my-2">

        <MessageView/>
      </div>
      <!-- 팝업 컴포넌트를 조건부 렌더링 -->
      <SelectChatRoom v-if="isPopupVisible" @close="closeChatRoom" @chat-room-selected="handleChatRoomSelected"/>
    </div>
  </div>
</template>



<script lang="ts">
import SelectChatRoom from '../components/SelectChatRoom.vue';
import LoginTimeoutConfirmModal from '../components/LoginTimeoutConfirmModal.vue';
import MessageView from './MessageView.vue';
import { generateClient } from "aws-amplify/api"
import { type Schema } from "../../amplify/data/resource"
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, ref } from 'vue'
import store from '../store';
import MainHeader from '../components/MainHeader.vue';

declare global {
  interface Window {
    Kakao: any;
  }
}


export default defineComponent({
  components: {
    SelectChatRoom,
    MessageView,
    MainHeader,
    LoginTimeoutConfirmModal
  },  
  data() {
    return {
      kakaoApiKey: "" ,
      message: "",
      isInitialized: false,
      isPopupVisible:false,
      selectedChatRoom: null,
      isChatRootSelected :false,
      showKakaoLoginForm: false,
      isWatingLoggedIn:false,
      isLoggedIn:false,
      showLoginConfirm:false
      
    };
  },
  computed:{
    ...mapGetters(['getKey', 'getExpireDate','getRoom']),

  },
  onBeforeRouteEnter(to: any, from: any, next) {
      this.kakaoApiKey = this.getKey || ''
      this.isLoggedIn = this.getExpireDate > -1 ? true:false
      this.isChatRootSelected = this.getRoom.name ? true:false
      this.selectedChatRoom = this.getRoom ? this.getRoom : null

      next()
    },

    // 라우트가 변경될 때
    onBeforeRouteUpdate(to : any, from:any , next) {
      this.kakaoApiKey = this.getKey || ''
      this.isLoggedIn = this.getExpireDate > -1 ? true:false
      this.isChatRootSelected = this.getRoom.name != "" ? true:false
      this.selectedChatRoom = this.getRoom ? this.getRoom : null
      next()
    },
  created() {
    // 컴포넌트 생성 시점에 getter로 가져온 값을 localKey에 할당
    this.kakaoApiKey = this.getKey || ''
    console.log(this.kakaoApiKey)
    if (!this.isInitialized && this.kakaoApiKey != "") {
      try{
        window.Kakao.init(this.kakaoApiKey);
        this.isInitialized = true;
      }
      catch{
        console.log("kakao already initialized")
      }
       
      }
    if(this.isInitialized && this.kakaoApiKey == ""){
      this.isInitialized = false;
    }
    this.isLoggedIn = this.getExpireDate > -1 ? true:false
    this.isChatRootSelected = this.getRoom.name  ? true:false
    this.selectedChatRoom = this.getRoom ? this.getRoom : null


  },
  methods: {
    ...mapActions(['updateKey','updateLoginState']),
    setKakaoKey() {
      this.updateKey(this.kakaoApiKey)
    },
    async kakaoInitialize() {
      
      if (!this.kakaoApiKey) {
        alert("Please enter a Kakao API key.");
        return;
      }
      if (!window.Kakao) {
        alert("Kakao SDK is not loaded. Please check that the SDK script is included in index.html.");
        return;
      }
      // 초기화되지 않은 경우에만 API 키로 초기화합니다.
      if (!this.isInitialized && this.kakaoApiKey != "") {
        try{
          window.Kakao.init(this.kakaoApiKey);
        }
        catch{
          console.log("Kakao already initialized")
        }
        
        this.isInitialized = true;
      }
      
      // //sendDefault를 호출하여 메시지 전송 인터페이스를 엽니다.
      const client = generateClient<Schema>()
      this.isWatingLoggedIn = true;
      const loginresult = await client.queries.autoSendServer({
           userKey: this.kakaoApiKey,
           userMessage: '스타트톡 로그인 완료',
           friendName: 'send_myself',
        })
      this.isWatingLoggedIn = false;
      console.log(loginresult)

      if(!loginresult.data){
        if(loginresult.errors[0].errorType == "Lambda:ExecutionTimeoutException"){
          this.showLoginConfirm = true
        }
      }
      else{
        const parsed = JSON.parse(loginresult.data.toString())
        this.setKakaoKey(this.kakaoApiKey);
        //const parsed = {'statusCode': 200, 'body':{message: 'test', cookieExpiredAt:1748121715, kakaoID:'sju0924'}}
        if(parsed.statusCode == 200){
          alert("로그인 완료")
          const body_parsed = JSON.parse(parsed.body.toString())
          const expire = body_parsed.cookieExpiredAt? body_parsed.cookieExpiredAt : -1
          let id =  body_parsed.kakaoID?  body_parsed.kakaoID : ""
          if(id == ""){
            const { data: infoRes } = await client.models.kakaoLoginInfo.get({ id: this.kakaoApiKey });
            id = infoRes?.userId;
          }
          this.isLoggedIn = true;
          this.updateLoginState({expiredAt:expire, kakaoID: id})
        }
        else if(parsed.statusCode == 403){
          alert("카카오톡 ID와 비밀번호를 입력해주세요")
          this.handleOpenForm()          
        }
        else{
          alert(parsed.body)
          this.updateKey("")
          store.dispatch('messageModel/stopSubscription');
        } 
      }
    },
     handleOpenForm ()  {
      this.showKakaoLoginForm = true;
    },

    handleCloseForm() {
      this.showKakaoLoginForm = false;
    },
    setting(){
      alert("기능 구현중")
    },
    openChatRoom() {
      this.isPopupVisible = true;
    },
    closeChatRoom() {
      this.isPopupVisible = false;
    },
    handleChatRoomSelected(chatRoom) {
      this.selectedChatRoom = chatRoom;
      this.isPopupVisible = false;
      this.isChatRootSelected = chatRoom != null ? true:false;

      
    },
    removeChatRoom() {
      // 채팅방 정보를 초기화하여 다시 선택할 수 있게 함
      this.isChatRootSelected = false;
      this.selectedChatRoom = null;
      
    },
    handleLoginSuccess(payload: { expiredAt: number; kakaoID: string }) {
      this.loginExpired = payload.expiredAt

      this.isLoggedIn = true;
      this.showLoginConfirm=false

    },
    handleLoginClose(){
      this.showLoginConfirm = false
    }
    
  }
});
</script>