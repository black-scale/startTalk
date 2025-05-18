import { Module } from 'vuex'
import { generateClient } from 'aws-amplify/data';
import { KeywordEntry, KeywordEntriesState, TimeItem } from '../../store/modules/keywordModule'
import type { Schema } from "../../../amplify/data/resource"

export interface messageEntry {
    room: string
    content: string
    contentToSend:string
    timestamp: string
    isSend:boolean
    error:boolean
    errorMessage:string,
    receiver: string
  }
  
export interface messageEntriesState {
  entries: messageEntry[],
  subscriptionStarted: boolean,
  subscription: any,
  mode: string,
}

const messageModule: Module<messageEntriesState, any> = {
  namespaced: true,
  state: {
    entries: [],
    subscriptionStarted: false,
    subscription: null as any,
    mode: 'off'
  },
  mutations: {
    ADD_MESSAGE_ENTRY(state, entry: messageEntry) {
      state.entries.push(entry)
    },
    UPDATE_MESSAGE_ENTRY(state, payload: { index: number; entry: messageEntry }) {
      state.entries.splice(payload.index, 1, payload.entry)
    },
    REMOVE_MESSAGE_ENTRY(state, index: number) {
      state.entries.splice(index, 1)
    },
    SET_MODE(state, _mode:string){
      state.mode = _mode
    },
    CLEAR_ALL_MESSAGES(state) {
      state.entries = [];
    }
  },
  actions: {
    addMessageEntry({ commit }, entry: messageEntry) {
      commit('ADD_MESSAGE_ENTRY', entry)
    },
    updateMessageEntry({ commit, state }, payload: { index: number; entry: messageEntry }) {
      console.log(payload)
      if (payload.index >= 0 && payload.index < state.entries.length) {
        commit('UPDATE_MESSAGE_ENTRY', payload)
      }
    },
    removeMessageEntry({ commit, state }, index: number) {
      if (index >= 0 && index < state.entries.length) {
        commit('REMOVE_MESSAGE_ENTRY', index)
      }
    },
    setMode({commit}, mode:string){
      commit('SET_MODE',mode)
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
    async sendMessage({ rootGetters, dispatch },entry:messageEntry) {
      const client = generateClient<Schema>();
      const apiKey = JSON.parse(localStorage.getItem('loginState')).devKey
      console.log( apiKey , entry.contentToSend, entry.receiver)
      try {
        const res = await client.queries.autoSendServer({
          userKey: apiKey || '',
          userMessage: entry.contentToSend,
          friendName: entry.receiver
        });

        if(res.data){
          const result = JSON.parse(res.data.toString());
        

          if (result.statusCode === 200) {
            entry.isSend = true;
            entry.error = false;
            entry.errorMessage = "";
            // 메시지 전송 성공 시, 관련 키워드들의 last_send 업데이트
            const allKeywordEntries = rootGetters['keywordModel/allKeywordEntries'];
            const matchedEntries = allKeywordEntries.filter(
              (k: KeywordEntry) =>
                k.room === entry.room && entry.contentToSend.includes(k.keyword)
            );
            
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);; // 현재 시간 포맷

            matchedEntries.forEach((k: KeywordEntry) => {
              k.last_send = now;
              // 변경된 키워드를 상태에 반영
              dispatch('keywordModel/updateKeywordEntry', k, { root: true });
            });

          } else {
            entry.error = true;
            entry.errorMessage = result.body || '전송 실패';
          }
        }
        else{
           entry.error = true;
           entry.errorMessage = res.errors.toString()|| '예외 발생';
        }
      } catch (err) {
        entry.error = true;
        entry.errorMessage = err.message || '예외 발생';
      }

      return entry as messageEntry
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
          console.log(matchedEntries, messageData)
          if (matchedEntries.length > 0) {
            for (const entry of matchedEntries) {
              const message_to_send = await dispatch('formatMessage', { message: messageData, keywordEntry: entry });
              let newMessage: messageEntry = {
                room: messageData.room,
                content: messageData.message,
                contentToSend: message_to_send,
                timestamp: messageData.createdAt,
                isSend: false,
                error: false,
                errorMessage: '',
                receiver: entry.receiver
              }
              if(state.mode=="auto"){
                newMessage = await dispatch('sendMessage', newMessage);
              }
              commit('ADD_MESSAGE_ENTRY', newMessage);
              console.log(newMessage)
            }
          }
        }
      });

      state.subscription = subscription;
      state.subscriptionStarted = true;
      console.log('메시지 구독 시작됨');
    },
    clearMessage({commit}){
      commit('CLEAR_ALL_MESSAGES');
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
    allMessageEntries(state): messageEntry[] {
      return state.entries
    },
    getMessageEntryByIndex: (state) => (index: number): messageEntry | undefined => {
      return state.entries[index]
    },
    getMode: (state) => state.mode
  
  }
}

export default messageModule
