import json
import logging
import boto3
import os
import signal

LAMBDA_NAME = os.environ.get('SERVICE_TESTER')
UNHANDLED_LAMBDA_ERROR_STATUS = 'Unhandled'

# ToDo: set pipeline constants including pipeline region
lambda_client = boto3.client('lambda', region_name='us-west-2')
code_pipeline = boto3.client('codepipeline', region_name='us-west-2')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def put_job_success(job, message):
    '''Notify CodePipeline of a successful job

    Args:
        job: The CodePipeline job ID
        message: A message to be logged relating to the job status

    Raises:
        Exception: Any exception thrown by .put_job_success_result()
    '''
    logger.info('Putting job success')
    code_pipeline.put_job_success_result(jobId=job)

def put_job_failure(job, message):
    '''Notify CodePipeline of a failed job

    Args:
        job: The CodePipeline job ID
        message: A message to be logged relating to the job status

    Raises:
        Exception: Any exception thrown by .put_job_failure_result()
    '''
    logger.info('Putting job failure')
    code_pipeline.put_job_failure_result(jobId=job, failureDetails={'message': message, 'type': 'JobFailed'})

def lambda_handler(event, context):
  def timeout_handler(_signal, _frame):
    '''Handle SIGALRM'''
    put_job_failure(code_pipeline_id, 'Lambda Timeout')
    return 'FAILED'

  signal.signal(signal.SIGALRM, timeout_handler)

  logger.info('EVENT:\n')
  logger.info(event)

  remaining_seconds = int(context.get_remaining_time_in_millis() / 1000)
  signal.alarm(remaining_seconds - 1)

  code_pipeline_id = event['CodePipeline.job']['id']
  try:
    response = lambda_client.invoke(FunctionName=LAMBDA_NAME)

    if response.get('FunctionError') == UNHANDLED_LAMBDA_ERROR_STATUS:
      exception = json.loads(response.get('Payload').read().decode('utf-8'))
      put_job_failure(code_pipeline_id, exception.get('errorMessage') or '')
    else:
      put_job_success(code_pipeline_id, 'Image Resize Successfull')
  except Exception as ex:
    put_job_failure(code_pipeline_id, repr(ex))

  return 'SUCCESS'

