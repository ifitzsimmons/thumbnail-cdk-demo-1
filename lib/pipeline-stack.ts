import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStage } from './app-stage';
import { LambdaInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';


export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipelineTrigger = CodePipelineSource.connection(
      'ifitzsimmons/cdk-pipeline-with-e2e',
      'main',
      {
        connectionArn: 'arn:aws:codestar-connections:us-east-1:928182438953:connection/d55151b5-59a4-4724-918b-58113828ef8b'
      }
    );

    const synthStep = new ShellStep('Synth', {
      input: pipelineTrigger,
      commands: [
        'pip install tox',
        'npm ci',
        'npm run test:lambda',
        'npm run build',
        'npx cdk synth'
      ]
    });

    const appStage = new AppStage(this, 'test', {
      env: {
        account: '928182438953',
        region: 'us-west-2',
      }
    });
    const appStageAction = new LambdaInvokeAction({
      actionName: 'TestThumbnailCreation',
      lambda: appStage.lambdaStack.testerLambda
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      selfMutation: true,
      synth: synthStep,
    });

    const stage = pipeline.addStage(appStage);

    // const step = new CodeDeploy()
  }
}