<template>
<!-- 상단 버튼 영역 -->
<div class="w-full flex flex-col">
  <div class="whitespace-nowrap space-x-2 overflow-x-auto ">
      <div class="flex justify-between items-center border-b space-x-2">
        <button @click="$router.push('/')" class="text-blue-500 font-medium bg-white">&lt; 뒤로가기</button>
        <button @click="$router.push('/keyword/register')" class="text-blue-500 bg-white font-medium">키워드 추가 +</button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded" @click="$router.push('/keyword')" >키워드 편집</button>
        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('auto')"
        >
          {{ local_mode === 'auto' ? '작동중: 자동 전송' : '자동 전송' }}
        </button>

        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('manual')"
        >
          {{ local_mode === 'manual' ? '작동중: 수동 전송' : '수동 전송' }}
        </button>

        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('off')"
        >
          {{ local_mode === 'off' ? '작동중: 정지' : '정지' }}
        </button>
      </div>
    </div>
    <!-- 메시지 컨텐츠 -->
  <div class="p-4 bg-gray-100 overflow-y-auto" style="height:80vh">
    <template v-for="(entry, index) in allMessageEntries" :key="index">
      <div
        v-if="local_room == entry.room"
        :key="index"
        class="w-full bg-gray-100 p-4 rounded shadow space-y-2"
      >

        <!-- 원본 메시지 -->
       <div class="text-sm text-gray-600 flex justify-between">
          <div class="text-xs text-gray-400">{{ entry.timestamp }}</div>
          <button
            class="bg-black bg-opacity-0 hover:bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center transition duration-150"
            @click="deleteEntry(entry, index)"
            >
            ❌
          </button>
        </div>
        <div  class="text-sm text-gray-600 flex">
            <span class="font-bold text-gray-700 pr-2">감지</span>
            <span v-html="highlightKeyword(entry.content, entry.keyword)"></span>
        </div>
        <!-- 전송 메시지 -->
        <div class="text-sm text-gray-800">
          <span class="font-bold text-gray-700">전송</span> {{ entry.contentToSend }}
        </div>

        <!-- 전송 버튼 -->
        <div class="flex justify-end">
          <button v-if="entry.isSend" 
            class="bg-gray-500 text-white text-sm px-4 py-1 rounded">
            전송됨
          </button>
          <button v-else-if="isSendingMap[index]"
            class="bg-gray-500 text-white text-sm px-4 py-1 rounded"
            :disabled="entry.isSend"
          >
            전송중
          </button>
          <button v-else-if="isUnsubscribedMap[index]"
            class="bg-red-500 text-white text-sm px-4 py-1 rounded"
            :disabled="entry.isSend"
          >
            수신 거부
          </button>
          <button v-else
            class="bg-blue-500 text-white text-sm px-4 py-1 rounded"
            @click="send(entry, index)"
            :disabled="entry.isSend"
          >
            전송
          </button>
        </div>
        <!-- 전송 메시지 -->
        <div v-if="entry.error" class="text-sm text-red-800" >
            <span class="font-bold text-gray-700">에러</span> {{ entry.errorMessage }}
        </div>
      </div>
    </template>
   
  </div>
</div>



</template>



<script lang="ts">
import { generateClient } from "aws-amplify/api"
import type { Schema } from '../../amplify/data/resource'
import { messageEntry, messageEntriesState } from '../store/modules/messageModule'
import { mapGetters, mapActions } from 'vuex'

const client = generateClient<Schema>()

export default {
  data(){
    return{
      isSendingMap: {} as Record<number, boolean>,
      isUnsubscribedMap: {} as Record<number, boolean>,
      local_mode : 'off',
      local_room : "",
      allMessageEntries:[],
      subscription: null as any,
    }
    
  },

  computed: {
    ...mapGetters(['getRoom','getKey','getID'])
    
  },
async created() {
  // 1. 로컬 room 이름 설정
  this.local_room = this.getRoom.name;
  console.log(this.getRoom, this.local_room);

  // 2. 메시지 불러오기
  this.messageReload()
  // 전송 모드 불러오기
  const { data: login_info, errors: login_errors } = await client.models.kakaoLoginInfo.get(
    {id:this.getKey}
  );
  if (login_errors && login_errors.length > 0) {
    console.error("DynamoDB fetch error:", login_errors);
  }else{
    this.local_mode = login_info.sendMode
  }

},

mounted() {
  // ✅ 진입 시 subscription 생성
  this.subscription = client.models.startTalkMessageByUser.onCreate().subscribe({
    next: async (data: any) => {
      if (!data) return;

      const { updatedAt, ...messageData } = data;

      if (messageData.userKey == this.getKey && this.$route.path === '/') {
        console.log('🔄 새 메시지 → 새로고침');
        this.messageReload()
      }
    }
  });
},
  methods: {
    ...mapActions('messageModel', ['updateMessageEntry','setMode','sendMessage','clearMessage']),
    
    async changeMode(mode:string) {
      this.local_mode = mode;
      const { data: login_info, errors: login_errors } = await client.models.kakaoLoginInfo.update(
        {
          id:this.getKey,
          sendMode: this.local_mode
        }
      );
      if (login_errors && login_errors.length > 0) {
        console.error("DynamoDB 로그인 모드 반영 실패:", login_errors);
      }
      console.log(`모드 변경됨: ${this.local_mode}`, login_info.sendMode);
    },
    async send(entry: messageEntry, index:number) {
      if (this.isSendingMap[index] || entry.isSend) return;

      this.isSendingMap[index] = true // Vue에서 반응형으로 처리되게
      const res : any = await this.sendMessage(entry)

      if(res == "success") {
        await client.models.startTalkMessageByUser.update({
          id: entry.id as any,
          is_send: true as any,
          errorMessage : null
        });
        await client.models.KeywordInfo.update({
            keyword: entry.keyword as any,
            room : entry.room as any,
            userKey: this.getKey as any,
            last_send : new Date().toISOString() as any
        })
        this.isSendingMap[index] = false 
        this.messageReload()
      } 
      else{
        const result = await client.models.startTalkMessageByUser.update({
          id: entry.id as any,
          errorMessage : res
        });
       this.isSendingMap[index] = false 
       this.messageReload()
      }
      
    },
    highlightKeyword(content: string, keyword: string) {
      if (!keyword) return content;
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 특수문자 이스케이프
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      return content.replace(regex, `<strong class="text-black font-bold">$1</strong>`);
    },
    
    async deleteEntry(entry: messageEntry, index: number) {
      if (!confirm(`정말로 이 메시지를 삭제하시겠습니까?\n\n"${entry.content}"`)) return;

      try {
        const result = await client.models.startTalkMessageByUser.delete({
          id: entry.id
        });

        if(!result.errors){
          this.allMessageEntries.splice(index, 1);
        }
        else{
          console.log("삭제 실패: ", result.errors)
        }
        
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    },
    async messageReload(){
      const { data: items, errors } = await client.models.startTalkMessageByUser.list(
        {filter:{room: {eq : this.local_room}, userKey: {eq:this.getKey}}}
      );

      if (errors && errors.length > 0) {
        console.error("DynamoDB fetch error:", errors);
      }
      else{
          // 3. 메시지 가공 후 저장
        this.allMessageEntries = (items ?? []).map((item) => {
        const timestamp = item.timestamp ?? new Date().toISOString();
        const errorMessage = item.errorMessage ?? "";
        const isSend = item.is_send ?? false;

        return {
          id: item.id,
          room: item.room,
          content: item.message ?? "",
          contentToSend:item.additional_message,
          keyword: item.keyword,
          timestamp,
          isSend,
          error: !!errorMessage,
          errorMessage,
          receiver: item.receiver
        };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 2. 수신 거부 목록 조회
        const { data: unsubscribed } = await client.models.UnsubscribeInfo.list({
          filter: {
            userId: { eq: this.getID } // 현재 사용자 ID 기준
          }
        });

        const blockedSet = new Set(unsubscribed.map(entry => entry.receiver));

        // 3. 인덱스별로 수신 거부 여부 매핑
        this.isUnsubscribedMap = {};
        this.allMessageEntries.forEach((entry: messageEntry, index: number) => {
          this.isUnsubscribedMap[index] = blockedSet.has(entry.receiver);
        });


      }
    }
  },
  beforeUnmount() {
    // ✅ 벗어날 때 subscription 해제
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
      console.log('🧹 Subscription 해제됨');
    }
  }
}

</script>