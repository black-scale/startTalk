import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { autoSendServer } from './functions/autoSendServer/resource';
import { saveKakaoLoginInfo } from './functions/saveKakaoLoginInfo/resource';
import { startTalkSender } from './functions/startTalkSender/resource';
import { pushSender } from './functions/pushSender/resource';

import { Stack } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";

const backend = defineBackend({
  data,
  autoSendServer,
  saveKakaoLoginInfo,
  startTalkSender,
  pushSender
  
});

const modelIntrospectionBucketStack = backend.createStack("model-introspection-bucket-stack");

// Import existing bucket
const modelIntrospectionBucket = Bucket.fromBucketAttributes(modelIntrospectionBucketStack, "startTalkModelBucket", {
  bucketArn: "arn:aws:s3:::starttalk-model-introspection",
  region: "ap-northeast-2"
});


backend.addOutput({
  storage: {
    aws_region: modelIntrospectionBucket.env.region,
    bucket_name: modelIntrospectionBucket.bucketName,
    // optional: `buckets` can be used when setting up more than one existing bucket
    buckets: [
      {
        aws_region: modelIntrospectionBucket.env.region,
        bucket_name: modelIntrospectionBucket.bucketName,
        name: modelIntrospectionBucket.bucketName,
      }
    ]
  },
});


/*
  Define an inline policy to attach to Amplify's unauth role
  This policy defines how unauthenticated/guest users can access your existing bucket
*/ 
const s3ModelPolicy = new Policy(backend.stack, "startTalkModelBucketPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`${modelIntrospectionBucket.bucketArn}/*`],
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:ListBucket"],
      resources: [
        `${modelIntrospectionBucket.bucketArn}`,
        `${modelIntrospectionBucket.bucketArn}/*`
      ]
    }),
  ],
});

backend.autoSendServer.resources.lambda.role?.attachInlinePolicy(s3ModelPolicy);
backend.startTalkSender.resources.lambda.role?.attachInlinePolicy(s3ModelPolicy);

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