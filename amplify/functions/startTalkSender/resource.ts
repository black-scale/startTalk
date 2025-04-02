import { defineFunction, secret } from '@aws-amplify/backend';

export const startTalkSender = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'starttalk-sender',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.js',
  resourceGroupName: "data",
  environment: {
    API_ENDPOINT: process.env.API_ENDPOINT || "null",
    API_KEY: secret('API_KEY') || process.env.API_KEY
  },
  
});
