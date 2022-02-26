import {
  CodePipelineActionFactoryResult,
  FileSet,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  Step } from "aws-cdk-lib/pipelines";
import { IStage } from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as Lambda from "aws-cdk-lib/aws-lambda";

export class LambdaInvokeStep extends Step implements ICodePipelineActionFactory {
  constructor(
    private readonly lambda: Lambda.Function,
    // private readonly input: FileSet,
  ) {
    super('LambdaInvokeStep');

    // This is necessary if your step accepts things like environment variables
    // that may contain outputs from other steps. It doesn't matter what the
    // structure is, as long as it contains the values that may contain outputs.
    // this.discoverReferencedOutputs({
    //   env: { /* ... */ }
    // });
  }

  public produceAction(stage: IStage, options: ProduceActionOptions): CodePipelineActionFactoryResult {

    // This is where you control what type of Action gets added to the
    // CodePipeline
    stage.addAction(new cpactions.LambdaInvokeAction({
      // Copy 'actionName' and 'runOrder' from the options
      actionName: options.actionName,
      runOrder: options.runOrder,

      // Jenkins-specific configuration
      lambda: this.lambda,

      // Translate the FileSet into a codepipeline.Artifact
      // inputs: [options.artifacts.toCodePipeline(this.input)],
    }));

    return { runOrdersConsumed: 1 };
  }
}
