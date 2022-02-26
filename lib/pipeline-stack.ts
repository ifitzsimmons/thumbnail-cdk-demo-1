import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStage } from './app-stage';
import { LambdaInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { LambdaInvokeStep } from './stage-action/lambda-invoke-action';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

/**
 * ToDo:
 * 1. Update test lambda permissions with necessary permissions to report pipielines status (done)
 * 2. Split out LambdaInvoke action into its own lambda that spins up at runtime
 * 3. Figure out how to add LambdaInvoke Action to pipeline
 * 4. Copy image into artifact bucket for testing after stack deployment
 * 5. Clean up repo and create constants
 * 6. Give pipeline access to invoke lambda function
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

    const testerLambda = new Lambda.Function(this, 'TestImageProcessor', {
      code: Lambda.Code.fromAsset('src/lambda/tst'),
      handler: 'integrationTest.lambda_handler',
      runtime: Lambda.Runtime.PYTHON_3_8,
      timeout: Duration.minutes(2),
      environment: {
        SERVICE_TESTER: appStage.testLambdaName,
      }
    });
    testerLambda.addToRolePolicy(new PolicyStatement({
      sid: 'InvokeServiceTester',
      effect: Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction'
      ],
      resources: ['*']
    }));

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      selfMutation: true,
      synth: synthStep,
    });

    pipeline.addStage(appStage, {
      post: [
        new LambdaInvokeStep(testerLambda)
      ]
    });
  }
}