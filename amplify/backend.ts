import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { autoSendServer } from './functions/autoSendServer/resource';

defineBackend({
  data,
  autoSendServer
});
