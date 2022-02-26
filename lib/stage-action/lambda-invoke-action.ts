import {
  CodePipelineActionFactoryResult,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  Step,
} from 'aws-cdk-lib/pipelines';
import { IStage } from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class LambdaInvokeStep extends Step implements ICodePipelineActionFactory {
  /**
   * @constructor
   */
  constructor(private readonly lambda: Lambda.Function) {
    super('LambdaInvokeStep');

    this.lambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'RunPipelineJob',
        effect: Effect.ALLOW,
        actions: [
          'codepipeline:PutJobSuccessResult',
          'codepipeline:PutJobFailureResult',
          'logs:*',
        ],
        resources: ['*'],
      })
    );
  }

  /**
   *
   * @param stage
   * @param options
   * @returns
   */
  public produceAction(
    stage: IStage,
    options: ProduceActionOptions
  ): CodePipelineActionFactoryResult {
    // This is where you control what type of Action gets added to the
    // CodePipeline
    stage.addAction(
      new cpactions.LambdaInvokeAction({
        actionName: options.actionName,
        runOrder: options.runOrder,

        lambda: this.lambda,
      })
    );

    return { runOrdersConsumed: 1 };
  }
}
