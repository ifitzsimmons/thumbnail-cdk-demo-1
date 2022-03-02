import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Creates a stack with two lambdas and 2 S3 Buckets
 *
 * When an image is uploaded to the ingestion bucket, the service will
 * compress the image to a smaller, thumbnail-sized image.
 *
 * The other Lambda is used to test the service.
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
  testerLambdaName: string;

  /**
   * @constructor
   */
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
   *
   * @param destinationBucket
   * @param inputBucket
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
