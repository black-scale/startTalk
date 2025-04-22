import { Module } from 'vuex'
import { generateClient } from 'aws-amplify/data';
import { KeywordEntry, KeywordEntriesState, TimeItem } from '../store/modules/keywordModule'
import type { Schema } from "../../amplify/data/resource"

export interface messageEntry {
    room: string
    content: string
    contentToSend:string
    timestamp: string
    isSend:boolean
    error:boolean
    errorMessage:string
  }
  
export interface messageEntriesState {
  entries: messageEntry[]
}

const messageModule: Module<messageEntriesState, any> = {
  namespaced: true,
  state: {
    entries: [],
    subscriptionStarted: false,
    subscription: null as any
  },
  mutations: {
    ADD_KEYWORD_ENTRY(state, entry: messageEntry) {
      state.entries.push(entry)
    },
    UPDATE_KEYWORD_ENTRY(state, payload: { index: number; entry: messageEntry }) {
      state.entries.splice(payload.index, 1, payload.entry)
    },
    REMOVE_KEYWORD_ENTRY(state, index: number) {
      state.entries.splice(index, 1)
    }
  },
  actions: {
    addMessageEntry({ commit }, entry: messageEntry) {
      commit('ADD_KEYWORD_ENTRY', entry)
    },
    updateMessageEntry({ commit, state }, payload: { index: number; entry: messageEntry }) {
      if (payload.index >= 0 && payload.index < state.entries.length) {
        commit('UPDATE_KEYWORD_ENTRY', payload)
      }
    },
    removeMessageEntry({ commit, state }, index: number) {
      if (index >= 0 && index < state.entries.length) {
        commit('REMOVE_KEYWORD_ENTRY', index)
      }
    },

    // @ input: message: subscribe 한 메시지, keywordEntry: 조건을 만족하는 keyword entry
    // @ output: 메시지에 미리 지정한 알림 시간 내용이 추가된 문자열
    formatMessage({ }, { message, keywordEntry }: { message: any, keywordEntry: KeywordEntry }) {
      let message_to_send = message.message;
      const date = new Date(message.createdAt);
    
      let hours = String(date.getHours()).padStart(2, '0');
      let minutes = String(date.getMinutes()).padStart(2, '0');
    
      message_to_send += `\n스타트 ${hours}:${minutes}`;
    
      let last_minute = 0;
      keywordEntry.set_time.forEach((time: TimeItem) => {
        date.setMinutes(date.getMinutes() + time.time - last_minute);
        hours = String(date.getHours()).padStart(2, '0');
        minutes = String(date.getMinutes()).padStart(2, '0');
        message_to_send += `/${time.word} ${hours}:${minutes}`;
        last_minute = time.time;
      });
    
      return message_to_send;
    },
    // @ input: message: receiver에게 보낼 메시지 내용, receiver: 수신자 이름(카카오톡 닉네임과 일치해야 함함)
    // @ output: 메시지 전송 결과
    async sendMessage({ rootGetters }, { message, receiver }: { message: string, receiver: string }) {
      const client = generateClient<Schema>();
    
      await client.queries.autoSendServer({
        userKey: rootGetters.getKey, // Vuex getter 사용
        userMessage: message,
        friendName: receiver,
      });
    },
    // 메시지 필터링
    // 톡방 이름과 키워드 포함 여부 검사
    // @ input: message: subscribe 한 메시지(json)
    // @ output: 조건이 맞는 keyword entry 배열 반환환
    filterMessage({ rootGetters }, message: any) {
      const allKeywordEntries = rootGetters['keywordModel/allKeywordEntries'];
      const matchedEntries = allKeywordEntries.filter(
        (entry: KeywordEntry) =>
          entry.room === message.room && message.message.includes(entry.keyword)
      );
      return matchedEntries;
    },
    async initSubscription({ state, dispatch, commit }) {
      if (state.subscriptionStarted) return; // ✅ 중복 방지

      const client = generateClient<Schema>();
  
      const subscription = client.models.startTalkMessage.onCreate().subscribe({
        next: async (data: any) => {
          if (!data) return;
  
          const { updatedAt, ...messageData } = data;
          
  
          const matchedEntries = await dispatch('filterMessage', messageData);
          if (matchedEntries.length > 0) {
            for (const entry of matchedEntries) {
              commit('ADD_MESSAGE', messageData);
              const message_to_send = await dispatch('formatMessage', { message: messageData, keywordEntry: entry });
              await dispatch('sendMessage', { message: message_to_send, receiver: entry.receiver });
            }
          }
        }
      });

      state.subscription = subscription;
      state.subscriptionStarted = true;
      console.log('메시지 구독 시작됨');
    },
    stopSubscription({ state }) {
      if (state.subscriptionStarted) {
        state.subscription.unsubscribe();
        state.subscription = null;
        state.subscriptionStarted = false;
        console.log('구독 종료됨');
      }
    }
  },
  getters: {
    allKeywordEntries(state): messageEntry[] {
      return state.entries
    },
    getKeywordEntryByIndex: (state) => (index: number): messageEntry | undefined => {
      return state.entries[index]
    }
  }
}

export default messageModule
