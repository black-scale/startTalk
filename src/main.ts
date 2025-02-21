import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import { Amplify } from "aws-amplify";
// import outputs from "../amplify_outputs.json";

// Amplify.configure(outputs);
// Kakao SDK 초기화 (index.html에서 로드된 스크립트를 활용)
console.log(import.meta.env.VITE_KAKAO_APP_KEY)

createApp(App).mount("#app");


