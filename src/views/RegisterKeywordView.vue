<template>
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2  w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <MainHeader/>
    <h2>Register Keyword Entry</h2>
    <form @submit.prevent="submitEntry">
      <div>
        <label>Keyword:</label>
        <input type="text" v-model="keyword" placeholder="Enter keyword" />
      </div>
      <div>
        <label>Receiver:</label>
        <input type="text" v-model="receiver" placeholder="Enter receiver" />
      </div>
      <div>
        <label>Set Time Items:</label>
        <div v-for="(item, index) in setTime" :key="index">
          <input type="number" v-model.number="item.time" placeholder="Time" />
          <input type="text" v-model="item.word" placeholder="Word" />
          <button type="button" @click="removeTimeItem(index)">Remove</button>
        </div>
        <button type="button" @click="addTimeItem">Add Time Item</button>
      </div>
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { KeywordEntry, TimeItem } from '../store/modules/keywordModule'
import { generateClient } from "aws-amplify/api"
import type { Schema } from "../../amplify/data/resource"
import MainHeader from '../components/MainHeader.vue';

const client = generateClient<Schema>()

export default defineComponent({
  name: 'RegisterKeywordEntry',
  data() {
    return {
      kakaoApiKey: "",
    };
  },
  components:{
    MainHeader
  },
  setup() {
    const store = useStore()
    const keyword = ref('')
    const receiver = ref('')
    const setTime = ref<TimeItem[]>([])

    const addTimeItem = () => {
      setTime.value.push({ time: 0, word: '' })
    }

    const removeTimeItem = (index: number) => {
      setTime.value.splice(index, 1)
    }

    const submitEntry = async () => {

      const _room = store.state.selectedRoom
      const _keyword = keyword.value
      const _receiver =  receiver.value
      const _set_time =  JSON.stringify(setTime.value)
      const _last_send =  null
      const _userKey = store.state.devKey

      
      try {
        // 1. 먼저 기존 데이터 조회
        const existing = await client.models.KeywordInfo.get({ keyword: _keyword, room: _room, userKey: _userKey });
        console.log(existing.data)
        if (existing.data) {
          // 2. 있으면 update
          const result = await client.models.KeywordInfo.update({
              room: _room,
              keyword: _keyword,
              receiver: _receiver,
              set_time: _set_time,
              last_send:_last_send,
              userKey: _userKey
          })                    

          if(!result.data){
            console.log(result.errors[0])
            return;
          }
        } else {
          // 3. 없으면 create
            const result = await client.models.KeywordInfo.create({
              room: _room,
              keyword: _keyword,
              receiver: _receiver,
              set_time: _set_time,
              last_send:_last_send,
              userKey: _userKey
          })                     

          if(!result.data){
            console.log(result.errors[0])
            return;
          }
        }
      } catch (error) {
        console.error("create or update failed", error);
      }
     
      keyword.value = ''
      receiver.value = ''
      setTime.value = []
    }

    return { keyword, receiver, setTime, addTimeItem, removeTimeItem, submitEntry }
  }
})
</script>
