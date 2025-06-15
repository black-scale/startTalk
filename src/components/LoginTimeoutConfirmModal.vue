<template>
  <!-- appsync에서 null 요청이 왔을 때 -->
  <div class="modal-backdrop">
        <div class="modal-overlay">
          <p class="text-black">로그인 메시지가 왔나요?</p>
          <button  class="bg-blue-500 text-white px-4 py-2 rounded w-full" @click="onConfirmYes">예</button>
          <button  class="bg-gray-500 text-white px-4 py-2 rounded w-full" @click="onConfirmNo">아니오</button>
        </div>
    </div>

</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"
import { mapActions } from 'vuex'

const client = generateClient<Schema>()
 // Timeout 모달에서 예 눌렀을때
 export default defineComponent({
    emits: ['login-success','close'],
    props: {
        userKey: {
        type: String,
        default: ''
        }
    },
    methods: {
        ...mapActions(['updateLoginState', 'updateKey']),
        async onConfirmYes() {
            this.showLoginConfirm = false;
            // 예 눌렀을 때 로직
            try {
                // 1) 쿠키 만료 시간 가져오기
                const { data: cookieRes } = await client.models.kakaoLoginCookie.get({ id: this.userKey });
                const expireAt = cookieRes?.expireAt;

                // 2) 사용자 ID 가져오기
                const { data: infoRes } = await client.models.kakaoLoginInfo.get({ id: this.userKey });
                const kakaoID = infoRes?.userId;


                if(!cookieRes || !infoRes){
                alert("로그인에 실패하였습니다. 로그인 정보를 확인하거나 잠시 후 다시 시도해주세요")
                return;
                }
                // 이후 로직: Vuex에 저장하고 화면 갱신하기
                this.updateLoginState({expiredAt:expireAt,kakaoID:kakaoID})
                this.updateKey(this.userKey)
                
                // 부모에게 emit
                this.$emit('login-success', { expireAt, kakaoID })

            } catch (err) {
                console.error('로그인 확인 처리 중 오류:', err);
            }
        },
        onConfirmNo() {
            
            // 아니오 눌렀을 때 로직
            alert("로그인 취소")
            this.$emit('close')
        }
    }
})
</script>