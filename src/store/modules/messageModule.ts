import { Module } from 'vuex'

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
    entries: []
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
