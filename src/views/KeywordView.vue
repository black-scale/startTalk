<template>
  <div class="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <!-- 상단 헤더 -->
    <div class="p-4 flex justify-between items-center border-b">
      <button @click="$router.push('/')" class="text-blue-500 font-medium bg-white">&lt; 뒤로가기</button>
      <button @click="$router.push('/keyword/register')" class="text-blue-500 bg-white font-medium">키워드 추가 +</button>
    </div>
    <!-- 두번째 헤더 -->
    <div class="p-4 flex justify-between items-center border-b space-x-2">
      <button @click="searchKeyword" class="text-white-700 font-medium bg-blue-200">키워드 검색</button>
      <button @click="selectAll" class="text-white-700 font-medium bg-blue-200">전체선택</button>
      <button @click="deleteSelected" class="text-white-700 font-medium bg-blue-200">선택삭제</button>
      <button class="text-white-700 font-medium bg-blue-200">미사용 키워드</button>
    </div>
  </div>
  <DisplayKeyword ref="displayKeyword"/>
</template>



<script>
import DisplayKeyword from '../components/DisplayKeyword.vue';
export default {
  components: {
    DisplayKeyword 
  },
  methods:{
    selectAll(){
      this.$refs.displayKeyword.toggleAll();
    }
  }
  
};
</script>