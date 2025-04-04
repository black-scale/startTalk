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

