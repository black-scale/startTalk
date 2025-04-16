// /frontend/src/store/index.ts
import { createStore } from 'vuex'
import keywordModelModule from './modules/keywordModule'
import createPersistedState from 'vuex-persistedstate'

export default createStore({
  // 전역 상태: persistedKey를 저장할 key 값
  state: {
    devKey: ''
  },
  mutations: {
    setKey(state, newKey: string) {
      state.devKey = newKey
    }
  },
  getters: {
    // persistedKey 값을 반환하는 getter
    getKey: (state) => state.devKey
  },
  actions: {
    updateKey({ commit }, newKey: string) {
      commit('setKey', newKey)
    }
  },
  modules: {
    // keywordModel 모듈도 함께 사용
    keywordModel: keywordModelModule
  },
  plugins: [
    // keywordModel 모듈 상태를 별도의 localStorage 키에 저장
    createPersistedState({
      key: 'keywordModelStore',
      paths: ['keywordModel']
    }),
    // 전역 상태의 persistedKey를 별도의 localStorage 키에 저장
    createPersistedState({
      key: 'devKey',
      paths: ['devKey']
    })
  ]
})