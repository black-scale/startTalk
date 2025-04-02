import { defineFunction, secret } from '@aws-amplify/backend';

export const saveKakaoLoginInfo = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'save-kakao-login-info',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.ts',
  environment: {
    API_ENDPOINT: process.env.API_ENDPOINT || "null",
    API_KEY: secret('API_KEY') || process.env.API_KEY,
    AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME || 'amplifyData'
  },
});