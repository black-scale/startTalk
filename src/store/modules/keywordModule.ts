// /frontend/src/store/modules/keywordModule.ts
import { Module } from 'vuex'

export interface TimeItem {
  time: number
  word: string
}

export interface KeywordEntry {
  room: string,
  keyword: string
  set_time: TimeItem[]
  receiver: string
  last_send:string
}

export interface KeywordEntriesState {
  entries: KeywordEntry[]
}

const keywordModule: Module<KeywordEntriesState, any> = {
  namespaced: true,
  state: {
    entries: []
  },
  mutations: {
    ADD_KEYWORD_ENTRY(state, entry: KeywordEntry) {
      state.entries.push(entry)
    },
    UPDATE_KEYWORD_ENTRY(state, payload: { index: number; entry: KeywordEntry }) {
      state.entries.splice(payload.index, 1, payload.entry)
    },
    REMOVE_KEYWORD_ENTRY(state, index: number) {
      state.entries.splice(index, 1)
    }
  },
  actions: {
    addKeywordEntry({ commit }, entry: KeywordEntry) {
      commit('ADD_KEYWORD_ENTRY', entry)
    },
    updateKeywordEntry({ commit, state }, payload: { index: number; entry: KeywordEntry }) {
      if (payload.index >= 0 && payload.index < state.entries.length) {
        commit('UPDATE_KEYWORD_ENTRY', payload)
      }
    },
    removeKeywordEntry({ commit, state }, index: number) {
      if (index >= 0 && index < state.entries.length) {
        commit('REMOVE_KEYWORD_ENTRY', index)
      }
    }
  },
  getters: {
    allKeywordEntries(state): KeywordEntry[] {
      return state.entries
    },
    getKeywordEntryByIndex: (state) => (index: number): KeywordEntry | undefined => {
      return state.entries[index]
    }
  },
}

export default keywordModule
