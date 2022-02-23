from time import sleep
import boto3
import botocore
import logging
import os

from datetime import datetime as dt

logger = logging.getLogger()
logger.setLevel(logging.INFO)
s3 = boto3.client('s3')

SUPPORTED_IMG_TYPES = ['jpg', 'jpeg', 'png']
DESTINATION_BUCKET = os.environ['DestinationBucket']
TEST_ARTIFACT_BUCKET = os.environ['TestArtifactBucket']
SOURCE_BUCKET = os.environ['SourceBucket']

def lambda_handler(event, context):
  logger.info(f'EVENT:\n', event)
  timestamp = int(dt.now().timestamp())
  key_name = f'test/{timestamp}.jpeg'
  destination_key_name = f'test/{timestamp}-thumbnail.jpeg'

  s3.copy_object(
    Bucket=SOURCE_BUCKET,
    Key=key_name,
    CopySource=f'{TEST_ARTIFACT_BUCKET}/replaceme.jpeg'
  )
  logger.info('Copied artifact to ingestion bucket')

  while True:
    try:
      object_data = s3.head_object(Bucket=DESTINATION_BUCKET, Key=destination_key_name)
      logger.info('Found thumbnail in Destination Bucket')
    except botocore.exceptions.ClientError as ex:
      error = ex.response['Error']
      if error['Code'] != '404' and error['Message'] != 'Not Found':
        raise ex

      continue

    if object_data:
      assert object_data['ContentLength'] == 142864
      logger.info('Thumbnail is expected size')

      try:
        s3.head_object(Bucket=SOURCE_BUCKET, Key=key_name)
        raise Exception('Source Image not deleted')
      except botocore.exceptions.ClientError as ex:
        error = ex.response['Error']
        assert error['Code'] == '404'
        assert error['Message'] == 'Not Found'
        logger.info('Original image deleted from ingestion bucket')
      return 'SUCCESS'

    sleep(30)
