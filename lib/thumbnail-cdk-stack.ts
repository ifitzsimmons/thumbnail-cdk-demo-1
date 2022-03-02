import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

const bucketPrefix = process.env.BUCKET_PREFIX;

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
 * const stack = ThumbnailCdkStack(this, 'ThumbnailGeneratorStack);
 * ```
 *
 */
export class ThumbnailCdkStack extends Stack {
  testArtifactBucketName = 'thumbnail-test-artifacts';
  testArtifactBucketArn = `arn:aws:s3:::${this.testArtifactBucketName}`;
  testerLambdaName: string;

  /**
   * @constructor
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.testerLambdaName = `TestImageProcessor-${this.region}`;

    const inputBucket = new Bucket(this, 'ThumbnailImageIngestionBucket', {
      bucketName: `${bucketPrefix}-thumbnail-image-ingestion-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const destinationBucket = new Bucket(this, 'ThumbnailImageDestinationBucket', {
      bucketName: `${bucketPrefix}-thumbnail-images-destination-${this.region}`,
    });

    const pythonLayers = new lambda.LayerVersion(this, 'ImageResizeLayer', {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      code: lambda.Code.fromAsset('src/layers/myLayer'),
    });

    this.createThumbnailGeneratorLambda(destinationBucket, inputBucket, pythonLayers);
    this.createThumbnailTesterLambda(destinationBucket, inputBucket);
  }

  /**
   * Creates Lambda that converts images uploaded to ingestion bucket into
   * image thumbnails in destination bucket
   *
   * @param destinationBucket - Bucket where thumbnail is stored
   * @param inputBucket - Ingestion Bucket that triggers the thumbnail generation
   *                      with object uploads
   * @param pythonLayers - PIP Dependencies
   */
  private createThumbnailGeneratorLambda = (
    destinationBucket: Bucket,
    inputBucket: Bucket,
    pythonLayers: LayerVersion
  ): void => {
    const s3EventSource = new S3EventSource(inputBucket, {
      events: [EventType.OBJECT_CREATED],
    });

    const imageProcessor = new lambda.Function(this, 'ImageProcessor', {
      functionName: 'ImageProcessor',
      code: lambda.Code.fromAsset('src/lambda/CreateThumbnail'),
      handler: 'createThumbnail.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      memorySize: 512,
      timeout: Duration.minutes(1),
      environment: {
        DestinationBucket: destinationBucket.bucketName,
      },
    });
    imageProcessor.addLayers(pythonLayers);
    imageProcessor.addEventSource(s3EventSource);

    imageProcessor.addToRolePolicy(
      new PolicyStatement({
        sid: 'GetImageFromSourceAndDelete',
        effect: Effect.ALLOW,
        actions: ['s3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
        resources: [`${inputBucket.bucketArn}/*`, inputBucket.bucketArn],
      })
    );
    imageProcessor.addToRolePolicy(
      new PolicyStatement({
        sid: 'PutThumbnailInDestinationBucket',
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [`${destinationBucket.bucketArn}/*`],
      })
    );
  };

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
