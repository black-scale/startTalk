// /frontend/src/store/index.ts
import { createStore } from 'vuex'
import keywordModelModule from './modules/keywordModule'
import messageModelModule from './modules/messageModule'
import createPersistedState from 'vuex-persistedstate'
export interface roomEntry {
  newRoom: string,
  newRegion: string
  newDisplay: string
}

export default createStore({
  // 전역 상태: persistedKey를 저장할 key 값
  state: {
    devKey: '',
    selectedRegion:'',
    selectedRoom:'',
    selectedRoomDisplay:'',
    kakaoID:'',
    expiredAt:-1
  },
  mutations: {
    setKey(state, newKey: string) {
      state.devKey = newKey
    },
    setRoom(state, payload: roomEntry){
      state.selectedRegion = payload.newRegion;
      state.selectedRoom = payload.newRoom;
      state.selectedRoomDisplay = payload.newDisplay;
    },
    setLoginState(state, payload: {expiredAt: number, kakaoID: string}){
      if(payload.kakaoID !=""){state.kakaoID = payload.kakaoID;}
      if(payload.expiredAt > -1){state.expiredAt = payload.expiredAt;}
      if(payload.kakaoID =="" && payload.expiredAt == -1){
        state.expiredAt = -1;
        state.kakaoID = "";
      }
    }
  },
  getters: {
    // persistedKey 값을 반환하는 getter
    getKey: (state) => state.devKey,
    getRoom: (state) => {
      return {
        region: state.selectedRegion,
        name: state.selectedRoom,
        display_name:state.selectedRoomDisplay
      }
    },
    getID:(state) => state.kakaoID,
    getExpireDate:(state) => state.expiredAt
  },
  actions: {
    updateKey({ commit }, newKey: string) {
      commit('setKey', newKey)
    },
    updateRoom({commit}, options:roomEntry){
      commit('setRoom', options)
    },
    updateLoginState({commit}, options:{expiredAt: number, kakaoID: string}){
      console.log(options)
      commit('setLoginState', options)
    }
  },
  modules: {
    keywordModel: keywordModelModule,
    messageModel: messageModelModule
  },
  plugins: [
    // 전역 상태의 persistedKey를 별도의 localStorage 키에 저장
    createPersistedState({
      key: 'loginState',
      paths: ['devKey', 'expiredAt', 'kakaoID']
    }),
    createPersistedState({
      key: 'chatRoom',
      paths: ['selectedRegion','selectedRoom','selectedRoomDisplay']
    }),
    // keywordModel 모듈 상태를 별도의 localStorage 키에 저장
    createPersistedState({
      key: 'keywordModelStore',
      paths: ['keywordModel']
    }),

    createPersistedState({
      key: 'messageModelStore',
      paths: ['messageModel.entries',
        'messageModel.mode']
    }),



    
  ]
})