import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'MyPipelineStack', {
  env: {
    account: '928182438953',
    region: 'eu-west-1',
  }
});

app.synth();
