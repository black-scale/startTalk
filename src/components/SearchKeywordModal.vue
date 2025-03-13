<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h2 class="text-lg font-bold mb-4">검색어 입력</h2>
        <input
          v-model="localQuery"
          type="text"
          placeholder="검색어 입력"
          class="border p-2 w-full mb-4"
        />
        <div class="flex justify-end space-x-2">
          <button @click="submitSearch" class="px-4 py-2 bg-blue-500 text-white rounded">
            검색
          </button>
          <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 rounded">
            닫기
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  export default {
    setup(props, { emit }) {
        const localQuery = ref('');
        const submitSearch = () => {
            emit('search-submitted', localQuery.value);
            emit('close');
            };
        return { localQuery, submitSearch };
  }
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
  }
  </style>
  