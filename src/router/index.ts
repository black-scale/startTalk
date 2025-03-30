import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainView from '../views/MainView.vue'
import KeywordView from '../views/KeywordView.vue'
import RegisterKeywordView from '../views/RegisterKeywordView.vue'
import AutoSend from '../views/AutoSend.vue'
import KakaoMessageSender from '../components/KakaoMessageSender.vue'
import KakaoMessgeSubscriber from '../components/KakaoMessgeSubscriber.vue'


const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'Home', component: MainView },
  { path: '/keyword', name: 'Keyword', component: KeywordView },
  { path: '/keyword/register', name: 'KeywordRegister', component: RegisterKeywordView },
  { path: '/send', name: 'KakaoMessageSender', component: KakaoMessageSender },
  { path: '/AutoSend', name: 'AutoSend', component: AutoSend },
  { path: '/sub', name: 'Subscriber', component: KakaoMessgeSubscriber }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
