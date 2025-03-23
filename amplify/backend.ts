import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { autoSendServer } from './functions/autoSendServer/resource';
import { saveKakaoLoginInfo } from './functions/saveKakaoLoginInfo/resource';

defineBackend({
  data,
  autoSendServer,
  saveKakaoLoginInfo
});
