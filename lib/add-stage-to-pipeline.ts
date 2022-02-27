import { AppStage } from './app-stage';
import { LambdaInvokeStep } from './stage-action/lambda-invoke-action';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { CodePipeline } from 'aws-cdk-lib/pipelines';
import { PipelineStack } from './pipeline-stack';
import { StageType } from './constants/stages';
import { AwsRegion } from './types';

/**
 * Creates the Lambda for the LambdaInvokeAction.
 * This Lambda will execute integration tests for the
 * Thumbnail generation service
 *
 * @returns Lambda used for running integration tests in the pipeline
 */
const createIntegrationTestLambda = (
  app: PipelineStack,
  appRegion: AwsRegion,
  stageName: StageType,
  testLambdaName: string
): Lambda.Function => {
  const testerLambda = new Lambda.Function(app, 'TestImageProcessor', {
    functionName: `IntegrationTest-${stageName}-${appRegion}`,
    code: Lambda.Code.fromAsset('src/lambda/tst'),
    handler: 'integrationTest.lambda_handler',
    runtime: Lambda.Runtime.PYTHON_3_8,
    timeout: Duration.minutes(2),
    environment: {
      SERVICE_TESTER: testLambdaName,
      TestLambdaRegion: appRegion,
    },
  });
  testerLambda.addToRolePolicy(
    new PolicyStatement({
      sid: 'InvokeServiceTester',
      effect: Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: ['*'],
    })
  );

  return testerLambda;
};

/**
 * Adds the stage and each of the stages stacks (in case of Wave deployment)
 * to the CodePipeline pipeline
 *
 * @param app - Pipeline CDK Stack
 * @param pipeline - CodePipeline pipeline
 * @param stageName - Name of the stage to be created
 * @param accountId - account where the stage will be deployed
 * @param region - Region where stage is deployed
 */
export const addStageToPipeline = (
  app: PipelineStack,
  pipeline: CodePipeline,
  stageName: string,
  accountId: string,
  region: AwsRegion
): void => {
  const appStage = new AppStage(app, stageName, {
    env: {
      account: accountId,
      region: region,
    },
  });

  if (stageName === StageType.BETA) {
    const testerLambda = createIntegrationTestLambda(
      app,
      region,
      stageName,
      appStage.testLambdaName
    );
    pipeline.addStage(appStage, {
      post: [new LambdaInvokeStep(testerLambda)],
    });
  }
};
