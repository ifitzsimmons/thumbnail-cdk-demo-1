#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PIPELINE_ACCOUNT, PIPELINE_REGION } from '../lib/constants/pipeline';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'ThumbnailCdkPipelineStack', {
  env: {
    account: PIPELINE_ACCOUNT,
    region: PIPELINE_REGION,
  },
});
