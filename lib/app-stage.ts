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
  // This will be used when we incorporate the integration test.
  testLambdaName: string;
  
  /** @constructor */
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    // Create the thumbnail generator application
    const thumbnailStack = new ThumbnailCdkStack(this, 'ThumbnailCreatorStack');

    // Create the resources needed to test the thumbnail generator service
    const thumbnailTestStack = new ThumbnailTestCdkStack(
      this,
      'ThumbnailTestStack',
      thumbnailStack.destinationBucket,
      thumbnailStack.inputBucket
    );
    this.testLambdaName = thumbnailTestStack.testerLambdaName;
  }
}
