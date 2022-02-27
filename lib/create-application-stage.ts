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
 *
 * @returns
 */
const createIntegrationTestLambda = (
  app: PipelineStack,
  appRegion: AwsRegion,
  testLambdaName: string
): Lambda.Function => {
  const testerLambda = new Lambda.Function(app, 'TestImageProcessor', {
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
 *
 * @param app
 * @param pipeline
 * @param stageName
 * @param accountId
 * @param region
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
      appStage.testLambdaName
    );
    pipeline.addStage(appStage, {
      post: [new LambdaInvokeStep(testerLambda)],
    });
  }
};
