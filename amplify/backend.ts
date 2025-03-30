import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { autoSendServer } from './functions/autoSendServer/resource';
import { saveKakaoLoginInfo } from './functions/saveKakaoLoginInfo/resource';
import { startTalkSender } from './functions/startTalkSender/resource';

import { Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";

const backend = defineBackend({
  data,
  autoSendServer,
  saveKakaoLoginInfo,
  startTalkSender
});

const startTalkMessageTable = backend.data.resources.tables["startTalkMessage"];
const policy = new Policy(
  Stack.of(startTalkMessageTable),
  "startTalkSenderStreamingPolicy",
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams",
        ],
        resources: ["*"],
      }),
    ],
  }
);
backend.startTalkSender.resources.lambda.role?.attachInlinePolicy(policy);

const mapping = new EventSourceMapping(
  Stack.of(startTalkMessageTable),
  "startTalkSenderEventStreamMapping",
  {
    target: backend.startTalkSender.resources.lambda,
    eventSourceArn: startTalkMessageTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
  }
);

mapping.node.addDependency(policy);