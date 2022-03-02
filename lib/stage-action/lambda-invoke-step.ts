import * as pipelines from 'aws-cdk-lib/pipelines';
import { IStage } from 'aws-cdk-lib/aws-codepipeline';
import { LambdaInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Adds a Lambda Invoke Action to a given stage
 *
 * Example:
 * ```ts
 * declare const lambdaFunction: Lambda.Function;
 * declare const stage: pipelines.StageDeployment;
 * stage.addPost(new LambdaInvokeStep(lambdaFunction))
 * ```
 */
export class LambdaInvokeStep
  extends pipelines.Step
  implements pipelines.ICodePipelineActionFactory
{
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
   * Adds the Lambda Invoke Action Step to the provided stage
   *
   * @param stage Stage within the CodePipeline
   * @param options Inherited from the stage
   * @returns Lambda Invoke Action
   */
  public produceAction(
    stage: IStage,
    options: pipelines.ProduceActionOptions
  ): pipelines.CodePipelineActionFactoryResult {
    stage.addAction(
      new LambdaInvokeAction({
        actionName: options.actionName,
        runOrder: options.runOrder,

        lambda: this.lambda,
      })
    );

    return { runOrdersConsumed: 1 };
  }
}
