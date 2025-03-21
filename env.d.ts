/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_KAKAO_APP_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  }
  