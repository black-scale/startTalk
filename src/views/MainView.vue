<template>
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2  w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="flex items-center justify-between p-4 bg-blue-500 text-white">
      <div class="text-lg font-bold">LOGO</div>
      <button @click="setting" class="focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
        </svg>
      </button>
    </div>
    <div class="p-4">
      <div v-if="!isInitialized" class="mb-4">
        <h2 class="text-lg font-bold">(1/2) 스타트톡을 사용하려면 카카오톡으로 로그인 해보세요</h2>
        <input type="text" id="apiKey" v-model="kakaoApiKey" placeholder="Enter your Kakao API key" />
        <button @click="kakaoInitialize" class="mt-2 w-full bg-yellow-500 text-white py-2 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none">
          카카오톡 로그인
        </button>
      </div>

      <!-- 선택된 채팅방이 있을 때 -->
      <div v-if="selectedChatRoom" class="flex items-center justify-between p-4 bg-blue-200 rounded-lg">
        <div class="flex items-center space-x-4">
          <h2 class="text-lg font-bold">
            {{ selectedChatRoom.region }} {{ selectedChatRoom.name }}
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
      <div v-else>
        <h2 class="text-lg font-bold">(2/2) 스타트톡 사용을 할 채팅방을 골라보세요</h2>
          <button @click="openChatRoom" class="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg shadow-md hover:bg-green-600 focus:outline-none">
            채팅방 선택
          </button>
      </div>   

      <!-- 모두 선택됐을 때 메뉴 바 노출 -->
      <div v-if="selectedChatRoom && isInitialized" class="flex overflow-x-auto space-x-4 my-2">
        <button class="flex flex-shrink-0 items-center w-40 bg-blue-200 px-4 py-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4v16m8-8H4" />
          </svg>
          키워드 검색
        </button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded" @click="$router.push('/keyword')" >키워드 편집</button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded">푸시알림 ON</button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded">작동중:자동 전송</button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded">작동중:수동 전송</button>
      </div>
      <!-- 팝업 컴포넌트를 조건부 렌더링 -->
      <SelectChatRoom v-if="isPopupVisible" @close="closeChatRoom" @chat-room-selected="handleChatRoomSelected"/>
    </div>
  </div>
</template>



<script>
import SelectChatRoom from '../components/SelectChatRoom.vue';
export default {
  components: {
    SelectChatRoom 
  },
  data() {
    return {
      kakaoApiKey: "",
      message: "",
      isInitialized: false,
      isPopupVisible:false,
      selectedChatRoom: null,
      
    };
  },
  methods: {
    async saveSession() {
      try {
        // DataStore.save()를 통해 Session 모델 인스턴스 저장
        const session = await DataStore.save(
          new Session({
            apiKey: this.kakaoApiKey,
            createdAt: new Date().toISOString(),
          })
        );
        console.log('세션 저장 성공:', session);
        // 생성된 세션의 고유 id를 localStorage 등에 저장
        localStorage.setItem('sessionId', session.id);
      } catch (error) {
        console.error('세션 저장 실패:', error);
      }
    },
    kakaoInitialize() {
      if (!this.kakaoApiKey) {
        alert("Please enter a Kakao API key.");
        return;
      }
      if (!window.Kakao) {
        alert("Kakao SDK is not loaded. Please check that the SDK script is included in index.html.");
        return;
      }
      // 초기화되지 않은 경우에만 API 키로 초기화합니다.
      if (!this.isInitialized) {
        window.Kakao.init(this.kakaoApiKey);
        this.isInitialized = true;
      }
      
      //sendDefault를 호출하여 메시지 전송 인터페이스를 엽니다.
      fetch("http://localhost:3000/run-selenium?userKey="+this.kakaoApiKey+"&userMessage=스타트톡 로그인 완료"+"&friendName=send_myself")
        .then(response => response.text())
        .then(data => console.log("Selenium 결과:", data))
        .catch(error => console.error("API 호출 오류:", error))


    },
    setting() {
        alert('Settings function executed');
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
      
    },
    removeChatRoom() {
      // 채팅방 정보를 초기화하여 다시 선택할 수 있게 함
      this.selectedChatRoom = null;
      
    }
  }
};
</script>