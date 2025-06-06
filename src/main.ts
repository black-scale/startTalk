import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import { Amplify } from "aws-amplify";
import router from './router'
import store from './store'
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

createApp(App)
  .use(router)
  .use(store)
  .mount('#app')
  
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

