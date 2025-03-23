import { defineFunction } from '@aws-amplify/backend';

export const saveKakaoLoginInfo = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'saveKakaoLoginInfo',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './src/handler.ts',
});