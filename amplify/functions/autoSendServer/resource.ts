import { defineFunction, secret, } from '@aws-amplify/backend';

export const autoSendServer = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'auto-send-server',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.ts',
  resourceGroupName: "data",
  environment: {
    API_ENDPOINT: process.env.API_ENDPOINT || "null",
    API_KEY: secret('API_KEY') || process.env.API_KEY,
    AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME || 'amplifyData',
    SEND_DEFAULT_URL: process.env.AMPLIFY_DATA_DEFAULT_NAME 
  },
  layers: {
    "chromium":
       "arn:aws:lambda:ap-northeast-2:982899336664:layer:chromium:1",
   },
   timeoutSeconds: 600
  
});