import { Context } from 'aws-lambda';
import { CodePipeline, Lambda } from 'aws-sdk';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json(),
    // Format the metadata object
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  ),
  transports: [new transports.Console()],
});

const LAMBDA_NAME = <string>process.env.CREATE_THUMBNAIL_DRIVER_NAME;
const TEST_LAMBDA_REGION = process.env.THUMBNAIL_GENERATOR_REGION;
const UNHANDLED_LAMBDA_ERROR_STATUS = 'Unhandled';

const lambda = new Lambda({ region: TEST_LAMBDA_REGION });
const codePipeline = new CodePipeline({ region: process.env.AWS_REGION });

interface PipelineJobLambdaEvent {
  'CodePipeline.job': {
    id: string;
    accountId: string;
  };
}

/**
 * Report test success back to pipeline. Pipeline will retry and eventually
 * timeout if you don't report the job status.
 *
 * @param jobId - Pipeline Job Execution Id
 */
const putPipelineJobSuccess = async (jobId: string): Promise<void> => {
  logger.info(`Putting job success for job: ${jobId}`);
  await codePipeline.putJobSuccessResult({ jobId }).promise();
};

/**
 * Report test failure back to pipeline. Pipeline will retry and eventually
 * timeout if you don't report the job status.
 *
 * @param jobId - Pipeline Job Execution Id
 * @param message - Information about the failure reason.
 */
const putPipelineJobFailure = async (jobId: string, message: string): Promise<void> => {
  logger.info(`Putting job failure with message: "${message}"`);
  await codePipeline
    .putJobFailureResult({
      jobId,
      failureDetails: { message, type: 'JobFailed' },
    })
    .promise();
};

/**
 * Invoke the ThumbnailGeneratorDriver Lambda and report result back
 * to CodePipelines
 */
module.exports.handler = async (event: PipelineJobLambdaEvent, context: Context) => {
  logger.info('EVENT:', { event });
  const jobId = event['CodePipeline.job'].id;

  // Return Job Failure 3 seconds before Lambda times out.
  const timeout = context.getRemainingTimeInMillis() - 3000;
  setTimeout(async () => {
    await putPipelineJobFailure(jobId, 'Lambda Timeout');
  }, timeout);

  try {
    const response = await lambda.invoke({ FunctionName: LAMBDA_NAME }).promise();
    logger.info(`Received Lambda Invocation Response:\n${JSON.stringify(response)}`);

    // If invocation caused an error, submit failure with information about error
    if (response?.FunctionError === UNHANDLED_LAMBDA_ERROR_STATUS) {
      const payload = JSON.parse(response.Payload?.toString() || '');
      const exception = payload.errorMessage || 'Error within Driver';

      await putPipelineJobFailure(jobId, exception);
    } else {
      await putPipelineJobSuccess(jobId);
    }
  } catch (err) {
    await putPipelineJobFailure(jobId, (<Error>err).message);
  }
};
