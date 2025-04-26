<template>
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2  w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"></div>
    <MainHeader/>
    <div class="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <!-- 두번째 헤더 -->
      <div class="p-4 flex justify-between items-center border-b space-x-2">
        <button @click="searchKeyword" class="text-white-700 font-medium bg-blue-200">키워드 검색</button>
        <button @click="selectAll" class="text-white-700 font-medium bg-blue-200">전체선택</button>
        <button @click="deleteSelected" class="text-white-700 font-medium bg-blue-200">선택삭제</button>
        <button class="text-white-700 font-medium bg-blue-200">미사용 키워드</button>
      </div>
    </div>
  <SearchKeywordModal
      v-if="showSearchModal"
      @search-submitted="searchKeyword"
      @close="showSearchModal = false"
    />
  <DisplayKeyword :searchQuery="searchQuery" ref="displayKeyword"/>
</template>



<script>
import DisplayKeyword from '../components/DisplayKeyword.vue';
import SearchKeywordModal from '../components/SearchKeywordModal.vue';
import MainHeader from '../components/MainHeader.vue';

export default {
  data(){
    return {
      searchQuery : "",
      showSearchModal : false
    }
  },
  components: {
    DisplayKeyword ,
    SearchKeywordModal,
    MainHeader
  },
  methods:{
    selectAll(){
      this.$refs.displayKeyword.toggleAll();
    },
    // SearchModal에서 검색어를 제출하면 해당 값을 저장
    searchKeyword (query) {
      this.showSearchModal = true;
      this.searchQuery = query;      
      console.log("searchQuery: ",this.searchQuery, query)
    },
  }
  
};
</script>