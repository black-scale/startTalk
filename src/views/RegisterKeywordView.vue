<template>
  <div>
    <h2>Register Keyword Entry</h2>
    <form @submit.prevent="submitEntry">
      <div>
        <label>Keyword:</label>
        <input type="text" v-model="keyword" placeholder="Enter keyword" />
      </div>
      <div>
        <label>Receiver:</label>
        <input type="text" v-model="receiver" @click="getReceiver" placeholder="Enter receiver" />
      </div>
      <div>
        <label>Set Time Items:</label>
        <div v-for="(item, index) in setTime" :key="index">
          <input type="number" v-model.number="item.time" placeholder="Time" />
          <input type="text" v-model="item.word" placeholder="Word" />
          <button type="button" @click="removeTimeItem(index)">Remove</button>
        </div>
        <button type="button" @click="addTimeItem">Add Time Item</button>
      </div>
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { KeywordEntry, TimeItem } from '@/store/modules/keywordModule'

export default defineComponent({
  name: 'RegisterKeywordEntry',
  data() {
    return {
      kakaoApiKey: "",
    };
  },
  async mounted() {
    // api key를 불러옴
    try {
        // localStorage에 저장된 sessionId를 가져옵니다.
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          // sessionId를 기준으로 해당 Session 레코드를 조회합니다.
          const session = await DataStore.query(Session, sessionId);
          if (session) {
            this.kakaoApiKey = session.apiKey;
            console.log('불러온 세션:', session);
          } else {
            console.warn('저장된 sessionId에 해당하는 세션이 없습니다.');
          }
        } else {
          console.warn('sessionId가 localStorage에 저장되어 있지 않습니다.');
        }
      } catch (error) {
        console.error('API 키를 불러오는 중 오류 발생:', error);
      }
  },
  methods:{
    getReceiver(){
        //sendDefault를 호출하여 메시지 전송 인터페이스를 엽니다.
      Kakao.Link.sendDefault({
        objectType: "text",
        text: "로그인 완료!",
        link: {
          mobileWebUrl: "https://yourwebsite.com",
          webUrl: "https://yourwebsite.com"
        }
      });
    //   Kakao.Auth.authorize({
    //   redirectUri: 'https://developers.kakao.com/tool/demo/oauth',
    //   state: 'sendfriend_feed',
    //   scope: 'friends,talk_message', // 앱 동의 항목 설정 및 사용자 동의 필요
    // });
    //   Kakao.Picker.selectFriend({
    //     title: '친구 선택',
    //   })
    //     .then(function(response) {
    //       console.log(response);
    //     })
    //     .catch(function(error) {
    //       console.log(error);
    //     });
     }
  },
  setup() {
    const store = useStore()
    const keyword = ref('')
    const receiver = ref('')
    const setTime = ref<TimeItem[]>([])

    const addTimeItem = () => {
      setTime.value.push({ time: 0, word: '' })
    }

    const removeTimeItem = (index: number) => {
      setTime.value.splice(index, 1)
    }

    const submitEntry = () => {
      const entry: KeywordEntry = {
        keyword: keyword.value,
        receiver: receiver.value,
        set_time: setTime.value
      }
      store.dispatch('keywordModel/addKeywordEntry', entry)
      // 폼 초기화
      keyword.value = ''
      receiver.value = ''
      setTime.value = []
    }

    return { keyword, receiver, setTime, addTimeItem, removeTimeItem, submitEntry }
  }
})
</script>
