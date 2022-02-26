import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class ThumbnailCdkStack extends Stack {
  testerLambdaName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.testerLambdaName = `TestImageProcessor-${this.region}`;

    const inputBucket = new Bucket(this, 'ThumbnailImageInputBucket', {
      bucketName: `thumbnail-image-input-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
    const s3EventSource = new S3EventSource(inputBucket, {
      events: [EventType.OBJECT_CREATED]
    });

    const destinationBucket = new Bucket(this, 'ThumbnailImageDestinationBucket', {
      bucketName: `thumbnail-images-destination-${this.region}`
    })
    const testArtifactBucket = new Bucket(this, 'ThumbnailTestArtifactsBucket', {
      bucketName: `thumbnail-test-artifacts-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const pythonLayers = new lambda.LayerVersion(this, 'ImageResizeLayer', {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      code: lambda.Code.fromAsset('src/layers/myLayer')
    });

    const imageProcessor = new lambda.Function(this, 'ImageProcessor', {
      code: lambda.Code.fromAsset('src/lambda/CreateThumbnail'),
      handler: 'createThumbnail.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      memorySize: 512,
      timeout: Duration.minutes(1),
      environment: {
        DestinationBucket: destinationBucket.bucketName
      }
    });
    imageProcessor.addLayers(pythonLayers);
    imageProcessor.addEventSource(s3EventSource);
    imageProcessor.addToRolePolicy(new PolicyStatement({
      sid: 'GetImageFromSourceAndDelete',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [
        `${inputBucket.bucketArn}/*`,
        inputBucket.bucketArn,
      ]
    }));
    imageProcessor.addToRolePolicy(new PolicyStatement({
      sid: 'PutThumbnailInDestinationBucket',
      effect: Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [
        `${destinationBucket.bucketArn}/*`,
      ]
    }));

    const testerLambda = new lambda.Function(this, 'TestImageProcessor', {
      functionName: this.testerLambdaName,
      code: lambda.Code.fromAsset('src/lambda/TestCreateThumbnail'),
      handler: 'testCreateThumbnail.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: Duration.minutes(5),
      environment: {
        DestinationBucket: destinationBucket.bucketName,
        SourceBucket: inputBucket.bucketName,
        TestArtifactBucket: testArtifactBucket.bucketName,
      }
    });
    testerLambda.addToRolePolicy(new PolicyStatement({
      sid: 'GetTestImgFromBucket',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:ListBucket'],
      resources: [
        `${testArtifactBucket.bucketArn}/*`,
        testArtifactBucket.bucketArn,
      ]
    }));
    testerLambda.addToRolePolicy(new PolicyStatement({
      sid: 'PutImageInInputBucket',
      effect: Effect.ALLOW,
      actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
      resources: [
        `${inputBucket.bucketArn}/*`,
        inputBucket.bucketArn,
      ]
    }));
    testerLambda.addToRolePolicy(new PolicyStatement({
      sid: 'AssertImageInDestinationBucket',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:ListBucket'],
      resources: [
        `${destinationBucket.bucketArn}/*`,
        destinationBucket.bucketArn,
      ]
    }));
  }
}
