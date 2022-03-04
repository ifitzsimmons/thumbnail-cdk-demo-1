import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Creates a stack with one lambda that will test the thumbnail
 * generation service
 *
 * Example:
 * ```ts
 * declare const this: Construct;
 * declare const inputBucket: Bucket;
 * declare const destinationBucket: Bucket;
 * const stack = new ThumbnailTestCdkStack(
 *   this,
 *   'ThumbnailGeneratorTestStack',
 *   destinationBucket,
 *   sinputBucket
 * );
 * ```
 *
 */
export class ThumbnailTestCdkStack extends Stack {
  testArtifactBucketName = 'thumbnail-test-artifacts';
  testArtifactBucketArn = `arn:aws:s3:::${this.testArtifactBucketName}`;
  // Used once we incorporate integration tests.
  testerLambdaName: string;

  /** @constructor */
  constructor(
    scope: Construct,
    id: string,
    destinationBucket: Bucket,
    inputBucket: Bucket,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.testerLambdaName = `TestImageProcessor-${this.region}`;
    this.createThumbnailTesterLambda(destinationBucket, inputBucket);
  }

  /**
   * Creates a Lambda that can be used to test the Thumbnail generation service
   */
  private createThumbnailTesterLambda = (
    destinationBucket: Bucket,
    inputBucket: Bucket
  ): void => {
    const testerLambda = new lambda.Function(this, 'TestImageProcessor', {
      functionName: this.testerLambdaName,
      code: lambda.Code.fromAsset('src/lambda/CreateThumbnailDriver'),
      handler: 'createThumbnailDriver.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: Duration.minutes(2),
      environment: {
        DestinationBucket: destinationBucket.bucketName,
        SourceBucket: inputBucket.bucketName,
        TestArtifactBucket: this.testArtifactBucketName,
      },
    });

    // Allow lambda to Get and List objects in the artifact and destination buckets
    testerLambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'GetTestImgFromArtifactAndDestinationBuckets',
        effect: Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `${destinationBucket.bucketArn}/*`,
          destinationBucket.bucketArn,
          `${this.testArtifactBucketArn}/*`,
          this.testArtifactBucketArn,
        ],
      })
    );

    // Allow the lambda to put objects in the application's ingestion bucket
    testerLambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'PutImageInInputBucket',
        effect: Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
        resources: [`${inputBucket.bucketArn}/*`, inputBucket.bucketArn],
      })
    );
  };
}
