// /frontend/src/store/index.ts
import { createStore } from 'vuex'
import keywordModelModule from './modules/keywordModule'
import createPersistedState from 'vuex-persistedstate'



export default createStore({
  modules: {
    keywordModel: keywordModelModule
  },
  plugins: [createPersistedState()]
})
