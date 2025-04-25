import { defineFunction, secret } from '@aws-amplify/backend';
import * as dotenv from 'dotenv';
dotenv.config(); 
export const saveKakaoLoginInfo = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'save-kakao-login-info',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.ts',
  environment: {
    API_ENDPOINT: process.env.API_ENDPOINT! ,
    API_KEY: secret('API_KEY') || '',
    SEND_DEFAULT_URL: process.env.SEND_DEFAULT_URL!,
    AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME!,
    AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY: process.env.AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY!,
    AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME: process.env.AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME!,
  },
});