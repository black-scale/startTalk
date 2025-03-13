<template>
  <!-- 키워드 리스트 -->
  <div class="p-4">
    <div 
      v-for="(entry, index) in filteredKeywords" 
      :key="index" 
      class="flex items-center justify-between bg-purple-100 p-2 rounded mb-2">
      <div class="flex items-center">
        <input type="checkbox" class="mr-2" v-model="entry.checked">
        <span class="text-gray-700 mr-4">{{ entry.keyword }}</span>
        <span class="text-gray-700">마지막 전송: {{ entry.last_send }}</span>
      </div>
      <button @click="handleRemoveKeyword(index)" class="text-red-500 font-medium bg-opacity-100">x</button>
    </div>
  </div>
</template>

<script lang="ts">
import { mapState, mapActions } from "vuex";
import { KeywordEntry } from '@/store/modules/keywordModule'

export default {
  namespaced: true,
  data() {
    return {
      // 체크박스 상태를 관리하기 위한 로컬 복사본
      localKeywords: []
    };
  },
  props: {
    searchQuery: {
      type: String,
      default: ''
    }
  },
   computed: {
    // Vuex에서 원본 키워드 데이터를 읽어옴
    ...mapState("keywordModel", {
      keywordEntries: state => state.entries
    }),
    filteredKeywords() {
      if (!this.searchQuery) {
        return this.localKeywords;
      }
      const query = this.searchQuery;
      return this.localKeywords.filter(entry =>
        entry.keyword.includes(query)
      );
      
    },
    // 모든 로컬 키워드가 선택되어 있는지 확인
    allSelected() {
      return this.localKeywords.length > 0 && this.localKeywords.every(entry => entry.checked);
    }
  },

    mounted() {
    // 만약 마운트 시점에 keywordEntries가 이미 존재한다면 초기화
    if (this.keywordEntries) {
      this.localKeywords = this.keywordEntries.map(entry => ({
        ...entry,
        checked: false
      }));
    }
  },
  watch: {
    // Vuex의 데이터가 업데이트 될 때 로컬 데이터도 갱신
    keywordEntries(newEntries) {
      if (newEntries) {
        this.localKeywords = newEntries.map(entry => ({
          ...entry,
          checked: false
        }));
      }
    }
  },
   methods: {
    ...mapActions("keywordModel", ["removeKeywordEntry"]),

    // 전체 선택/해제
    toggleAll() {
      const allChecked = this.localKeywords.every(entry => entry.checked);
      const newChecked = !allChecked;
      this.localKeywords.forEach(entry => {
        entry.checked = newChecked;
      });
    },
    // 삭제 버튼 클릭 시 로컬과 Vuex에서 모두 삭제 처리
    handleRemoveKeyword(index) {
      // Vuex 스토어에서 삭제
      this.removeKeywordEntry(index);
      // 로컬 배열에서 삭제
      this.localKeywords.splice(index, 1);
    }
  }
}
</script>
