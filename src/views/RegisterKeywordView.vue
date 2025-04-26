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
import MainHeader from '../components/MainHeader.vue';

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

    const submitEntry = () => {
      const entry: KeywordEntry = {
        room: store.state.selectedRoom,
        keyword: keyword.value,
        receiver: receiver.value,
        set_time: setTime. value,
        last_send: null
      }
      store.dispatch('keywordModel/addKeywordEntry', entry)
      // 폼 초기화
      keyword.value = ''
      receiver.value = ''
      setTime.value = []
    }

    return { keyword, receiver, setTime, addTimeItem, removeTimeItem, submitEntry }
  }
})
</script>
