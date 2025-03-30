import { defineFunction } from '@aws-amplify/backend';
import outputs from "../../../amplify_outputs.json";

export const startTalkSender = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'startTalkSender',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.js',
  resourceGroupName: "data",
  environment: {
    APPSYNC_ENDPOINT: outputs.data.url,
    APPSYNC_API_KEY:outputs.data.api_key,
  },
  
});
