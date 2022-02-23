import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { ThumbnailCdkStack } from './thumbnail-cdk-stack';

export class AppStage extends cdk.Stage {
    // Stack that includes all resources for thumbnail creation
    lambdaStack: ThumbnailCdkStack;

    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);

      this.lambdaStack = new ThumbnailCdkStack(this, 'LambdaStack');
    }
}