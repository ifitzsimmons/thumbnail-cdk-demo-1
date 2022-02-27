import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { GitHubConstants } from './constants/pipeline';
import { STAGES } from './constants/stages';
import { addStageToPipeline } from './add-stage-to-pipeline';

/**
 * Creates the CodePipeline pipeline for the Thumbnail Generation Service
 */
export class PipelineStack extends Stack {
  /**
   * @constructor
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipelineTrigger = CodePipelineSource.connection(
      GitHubConstants.repo,
      GitHubConstants.branch,
      { connectionArn: GitHubConstants.connection }
    );

    const synthStep = new ShellStep('Synth', {
      input: pipelineTrigger,
      commands: [
        'pip install tox',
        'npm ci',
        'npm run test:lambda',
        'npm run build',
        'npx cdk synth',
      ],
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'ThumbnailServicePipeline',
      selfMutation: true,
      synth: synthStep,
    });

    STAGES.forEach(({ stageName, account }) => {
      addStageToPipeline(this, pipeline, stageName, account.id, account.region);
    });
  }
}
