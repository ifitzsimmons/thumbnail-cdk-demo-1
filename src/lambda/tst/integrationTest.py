import boto3
import os

LAMBDA_NAME = os.environ.get('SERVICE_TESTER')

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
  lambda_client.invoke(
    FunctionName=LAMBDA_NAME
  )

  return 'SUCCESS'
