import { defineFunction, secret } from '@aws-amplify/backend';
import * as dotenv from 'dotenv';
dotenv.config(); 

export const startTalkSender = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'starttalk-sender',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.ts',
  environment: {
    AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME!,
    AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY: process.env.AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_KEY!,
    AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME: process.env.AMPLIFY_DATA_MODEL_INTROSPECTION_SCHEMA_BUCKET_NAME!,
    API_KEY: secret('API_KEY') || '',
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY!
  },
  timeoutSeconds: 700,
  
});
  