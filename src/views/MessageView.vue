<template>
<!-- 상단 버튼 영역 -->
<div class="w-full flex flex-col ">
  <div class="whitespace-nowrap space-x-2 overflow-x-auto ">
      <div class="flex justify-between items-center border-b space-x-2">
        <button @click="$router.push('/')" class="text-blue-500 font-medium bg-white">&lt; 뒤로가기</button>
        <button @click="$router.push('/keyword/register')" class="text-blue-500 bg-white font-medium">키워드 추가 +</button>
        <button class="flex-shrink-0 w-30 bg-blue-200 px-4 py-2 rounded" @click="$router.push('/keyword')" >키워드 편집</button>
        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('auto')"
        >
          {{ mode === 'auto' ? '작동중: 자동 전송' : '자동 전송' }}
        </button>

        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('manual')"
        >
          {{ mode === 'manual' ? '작동중: 수동 전송' : '수동 전송' }}
        </button>

        <button
          class="text-blue-500 font-medium bg-blue-100 px-3 py-1 rounded"
          @click="changeMode('off')"
        >
          {{ mode === 'off' ? '작동중: 정지' : '정지' }}
        </button>
      </div>
    </div>
    <!-- 메시지 컨텐츠 -->
  <div class="w-full p-4 bg-gray-100">
    <div
      v-for="(entry, index) in allMessageEntries"
      :key="index"
      class="w-full bg-gray-100 p-4 rounded shadow space-y-2"
    >
      <!-- 원본 메시지 -->
      <div class="text-sm text-gray-600 flex justify-between">
        <div><span class="font-bold text-gray-700">감지</span> {{ entry.content }}</div>
        <div class="text-xs text-gray-400">{{ entry.timestamp }}</div>
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
          class="bg-blue-500 text-white text-sm px-4 py-1 rounded"
          @click="send(entry, index)"
          :disabled="entry.isSend"
        >
           전송중
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
  </div>
</div>



</template>



<script lang="ts">
 import { mapGetters, mapActions,mapState } from 'vuex'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { messageEntry, messageEntriesState } from '../store/modules/messageModule'
import { toRaw } from 'vue';

const client = generateClient<Schema>()

export default {
  data(){
    return{
      isSendingMap: {} as Record<number, boolean>
    }
    
  },

  computed: {
    ...mapState("messageModel", {
      allMessageEntries: (state:messageEntriesState)  => state.entries,
      mode: (state:messageEntriesState) => state.mode
    }),
    
  },

  methods: {
    ...mapActions('messageModel', ['updateMessageEntry','setMode','sendMessage','clearMessage']),
    
    changeMode(mode:string) {
      this.mode = mode;
      this.setMode(this.mode);
      console.log(`모드 변경됨: ${mode}`);
    },
    async send(entry: messageEntry, index:number) {
      if (this.isSendingMap[index] || entry.isSend) return;

      this.isSendingMap[index] = true // Vue에서 반응형으로 처리되게
      const res = await this.sendMessage(entry)
      const raw_res = toRaw(res)
      console.log(raw_res)
      this.updateMessageEntry({ index: index, entry: raw_res });

    }
  }
}

</script>