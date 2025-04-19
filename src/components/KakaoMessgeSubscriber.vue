<template>
  <div>
    <h2>실시간 메시지</h2>
    <ul>
      <li><p>Current Message: </p></li>
      <li v-for="(message, index) in messages" :key="message.id">
        {{ message.message }} <small>({{ message.createdAt }})</small>
      </li>
      <li><p>filtered Message: </p></li>
      <li v-for="(message, index) in filtered_messages" :key="message.id">
        {{ message.message }} <small>({{ message.createdAt }})</small>
      </li>
    </ul>
  </div>
  <div
        v-for="(entry, index) in localKeywords"
        :key="index"
        class="flex items-center justify-between bg-purple-100 p-2 rounded mb-2"
      >
    <div class="flex items-center">
      <input type="checkbox" class="mr-2" v-model="entry.checked">
      <span class="text-gray-700 mr-4">{{ entry.keyword }}</span>
      <span class="text-gray-700">마지막 전송: {{ entry.last_send }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import type { Schema } from "../../amplify/data/resource"
import { generateClient } from 'aws-amplify/data';
import { mapState, mapActions, mapGetters } from "vuex"
import { KeywordEntry, KeywordEntriesState, TimeItem } from '../store/modules/keywordModule'
import { timeEnd } from "console";

const  client = generateClient<Schema>();

export default {

  data() {
    return {
      messages: [] as Array<any>,
      filtered_messages: [] as Array<any>,
      localKeywords: [],
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

        // 조건이 일치하는 Keyword Item 을 찾고 메시지 전송
        const matchedEntries = this.filterMessage(data)
        if(matchedEntries.length > 0){
          matchedEntries.forEach((entry: KeywordEntry) => {
            let message_to_send = this.formatMessage(data, entry)
            this.sendMessage(message_to_send, entry.receiver)
          });
        }
      },
      error: (error) => console.warn('Subscription error:', error)
    });

    if (this.keywordEntries) {
      this.localKeywords = this.keywordEntries.map((entry:KeywordEntry)  => ({
        ...entry,
        checked: false
      }));
    }
  },
  computed: {
    // Vuex에서 원본 키워드 데이터를 읽어옴
    ...mapGetters('keywordModel', ['allKeywordEntries']),      
    ...mapGetters(['getKey']),
    
  },
  beforeUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  },
   methods: {
    ...mapActions("keywordModel", ["removeKeywordEntry"]),
    
    // 메시지 필터링
    // 톡방 이름과 키워드 포함 여부 검사
    // @ input: message: subscribe 한 메시지(json)
    // @ output: 조건이 맞는 keyword entry 배열 반환환
    filterMessage(message: any){
      console.log("filter ",message.message)

      const matchedEntries = this.allKeywordEntries.filter((entry: { room: any; keyword: any }) => 
        entry.room === message.room && 
        message.message.includes(entry.keyword)
      )
      console.log("[filter] Matched Entries: ",matchedEntries)
      return matchedEntries
    },

    // @ input: message: receiver에게 보낼 메시지 내용, receiver: 수신자 이름(카카오톡 닉네임과 일치해야 함함)
    // @ output: 메시지 전송 결과
    sendMessage(message: string, receiver: string){
      client.queries.autoSendServer({
          userKey: this.getKey,
          userMessage: message,
          friendName: receiver,
      })
    },

    // @ input: message: subscribe 한 메시지, keywordEntry: 조건을 만족하는 keyword entry
    // @ output: 메시지에 미리 지정한 알림 시간 내용이 추가된 문자열
    formatMessage(message: any, keywordEntry : KeywordEntry){
      let message_to_send = message.message

      //시간 추출
      const date = new Date(message.createdAt)
      let hours = String(date.getHours()).padStart(2, '0')
      let minutes = String(date.getMinutes()).padStart(2, '0')

      // 스타트 시각 추가가
      message_to_send = message_to_send + '\n'
      message_to_send = message_to_send + `스타트 ${hours}:${minutes}`

      // 시간 키워드 추가
      let last_minute = 0
      keywordEntry.set_time.forEach((time: TimeItem) => {
        date.setMinutes(date.getMinutes() + time.time - last_minute)
        hours = String(date.getHours()).padStart(2, '0')
        minutes = String(date.getMinutes()).padStart(2, '0')
        message_to_send = message_to_send + `/${time.word} ${hours}:${minutes}`

        last_minute = time.time
      })
      console.log('[format] Message_to_send: ',message_to_send)
      return message_to_send
    }
  }
}
</script>

<style scoped>
/* 필요한 스타일을 추가하세요 */
</style>
