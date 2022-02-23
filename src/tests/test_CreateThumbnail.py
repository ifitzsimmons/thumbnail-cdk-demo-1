import boto3
from unittest.mock import  Mock, patch

from CreateThumbnail.createThumbnail import lambda_handler

@patch('CreateThumbnail.createThumbnail.upload_resized_image')
@patch('CreateThumbnail.createThumbnail.resize_image')
@patch('CreateThumbnail.createThumbnail.s3')
def test_lambda_handler(
  mock_boto: Mock,
  mock_resize: Mock,
  mock_image_upload: Mock,
  s3_trigger_event: dict,
  mock_s3_get
):
  mock_boto.get_object.return_value = mock_s3_get
  mock_resize.return_value = ""

  src_bucket = s3_trigger_event['Records'][0]['s3']['bucket']['name']
  src_key = s3_trigger_event['Records'][0]['s3']['object']['key']

  response = lambda_handler(s3_trigger_event, None)
  mock_boto.get_object.assert_called_with(Bucket=src_bucket, Key=src_key)
  mock_resize.assert_called_with('jhigahjdshjk', 'png')
  mock_image_upload.assert_called_with('srcKey-thumbnail.png', '')
  assert response == {
    'resizedKey': 'srcKey-thumbnail.png',
    's3Location': 'DstBucket'
  }