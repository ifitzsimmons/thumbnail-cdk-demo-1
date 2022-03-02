import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThumbnailCdkStack } from './thumbnail-cdk-stack';
import { ThumbnailTestCdkStack } from './thumbnail-testing-cdk-stack';

/**
 * Creates resources needed for each Application Stage
 * for the Thumbnail Generation Service
 */
export class AppStage extends cdk.Stage {
  // Name of the Lambda function that is used for manual testing
  testLambdaName: string;

  /**
   * @constructor
   */
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const thumbnailStack = new ThumbnailCdkStack(this, 'ThumbnailCreatorStack');
    const thumbnailTestStack = new ThumbnailTestCdkStack(
      this,
      'ThumbnailTestStack',
      thumbnailStack.destinationBucket,
      thumbnailStack.inputBucket
    );
    this.testLambdaName = thumbnailTestStack.testerLambdaName;
  }
}
