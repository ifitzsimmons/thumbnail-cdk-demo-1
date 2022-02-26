#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'ThumbnailCdkPipelineStack', {
  env: {
    account: '928182438953',
    region: 'us-west-2',
  },
});
