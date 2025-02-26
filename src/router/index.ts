import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainView from '../views/MainView.vue'
import KeywordView from '../views/KeywordView.vue'
import RegisterKeywordView from '../views/RegisterKeywordView.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'Home', component: MainView },
  { path: '/keyword', name: 'Keyword', component: KeywordView },
  { path: '/keyword/register', name: 'KeywordRegister', component: RegisterKeywordView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
