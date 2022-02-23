import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStage } from './app-stage';
import { LambdaInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { IStage } from 'aws-cdk-lib/aws-apigateway';
import { LambdaApplication } from 'aws-cdk-lib/aws-codedeploy';

/**
 * ToDo:
 * 1. Update test lambda permissions with necessary permissions to report pipielines status (done)
 * 2. Split out LambdaInvoke action into its own lambda that spins up at runtime
 * 3. Figure out how to add LambdaInvoke Action to pipeline
 * 4. Copy image into artifact bucket for testing after stack deployment
 * 5. Clean up repo and create constants
 */

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
    const { testerLambda } = appStage.lambdaStack;

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      selfMutation: true,
      synth: synthStep,
    });

    pipeline.addStage(appStage, {
      // post: [
      //   new ShellStep('Validate Image Resizer', {
      //     commands: [
      //       `aws lambda invoke --function-name ${testerLambda.functionName}`
      //     ]
      //   })
      // ]
    });
    // pipeline.addStage(new LambdaApplication(this, 'TestStage', {
    //   applicationArn: appStage.lambdaStack.testerLambda.functionArn,

    // }))

    // const step = new CodeDeploy()
  }
}