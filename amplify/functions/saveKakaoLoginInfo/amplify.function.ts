// amplify/functions/saveKakaoLoginInfo/amplify.function.ts

export const config = {
    build: {
      esbuild: {
        external: ['aws-sdk'], // 런타임에 이미 포함되어 있음
      },
    },
  }
  