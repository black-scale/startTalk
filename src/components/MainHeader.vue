<template>
<div class="flex items-center justify-between p-4 bg-blue-500 text-white">
    <button v-if="!isRoot" @click="goBack" class="focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div class="text-lg font-bold">LOGO</div>
    <button @click="setting" class="focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
      </svg>
    </button>
    <KakaoLoginInfoForm
      v-if="showKakaoLoginForm"
      @close="handleCloseKakaoForm"
/>    <KakaoLoginInfoForm
      v-if="showForm"
      @close="closeform"
/>
  </div>    
</template>

<script lang="ts">

import KakaoLoginInfoForm from '../components/KakaoLoginInfoForm.vue'
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'


export default defineComponent({
    components: {
      KakaoLoginInfoForm,
    },  
    computed:{
      ...mapGetters(['getKey', 'getExpireDate']),
  
    },
    setup() {
    const router = useRouter()
    const route = useRoute()

    const isRoot = computed(() => route.path === '/')

    const goBack = () => {
      router.back()
    }

    return {
      isRoot,
      goBack,
    }
  },
  props: {
    showKakaoLoginForm: {
      type: Boolean,
      required: false,
    },
    kakaoApiKey: {
      type: String,
      required: false,
    }
  },
    data() {
      return {
        message: "",
        isLoggedIn: false,
        isWatingLoggedIn:false,
        showForm:false
        
      };
    },

    created() {
      // 컴포넌트 생성 시점에 getter로 가져온 값을 localKey에 할당
      this.isLoggedIn = this.getExpireDate > -1 ? true:false
  
    },
    methods: {
      ...mapActions(['updateKey','updateLoginState']), 
      setting() {

        if(this.showKakaoLoginForm){
            this.$emit('open-kakao-form')  // 🔥 부모한테 "열어줘!" 요청
            if (!this.kakaoApiKey) {
            alert('API Key를 먼저 입력해주세요!')
            return
          }
          
        }
        else{
          if (!this.getKey) {
            alert('API Key를 먼저 입력해주세요!')
            return
          }
          this.showForm = true;
        }
        
      },
      closeform(){
        this.showForm = false
      },
      handleCloseKakaoForm() {
        this.$emit('close-kakao-form') // 🔥 부모한테 "닫아줘!" 요청
      },
    }
  });
  </script>


