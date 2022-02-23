import boto3
import logging
import re
import os

from io import BytesIO
from PIL import Image
from typing import Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)
s3 = boto3.client('s3')

SUPPORTED_IMG_TYPES = ['jpg', 'jpeg', 'png']
DESTINATION_BUCKET = os.environ['DestinationBucket']

# raises indexError and AssertionError
def get_image_type(src_key: str) -> str:
    """Returns image type if it is valid

    Verifies that the type of image uploaded to S3 is a supported image type

    Args:
      src_key: File name from S3

    Returns:
      image_type: Type of image uploaded to s3, lowercased.

    Raises:
      IndexError: If the file does not have a file extension
      AssertionError: If the file type is not supported

    >>> get_image_type('test.png')
    'png'

    >>> get_image_type('test')
    Traceback (most recent call last):
    AssertionError

    >>> get_image_type('test.txt')
    Traceback (most recent call last):
    AssertionError: Unsupported image type: 'txt'
    """
    # Infer the image type from the file suffix.
    type_match: Optional[re.Match] = re.search(r'\.([^.]*)$', src_key)

    try:
      assert type_match
      image_type: str = type_match[1].lower()
    except Exception as e:
      logger.exception(f'Unable to retrieve image type from file: {src_key}', exc_info=e)
      raise e

    assert image_type in SUPPORTED_IMG_TYPES, f"Unsupported image type: '{image_type}'"
    return image_type

def get_resized_image_key(src_key: str, image_type: str) -> str:
    """Get information about the uploaded file and rename

    Args:
      src_key: Name of the uploaded file
      image_type: Type of image.

    Returns:
      dst_key: renamed image file

    Raises:
      TypeError: When file name has unexpected pattern

    >>> get_resized_image_key('key+ as.png.png', 'png')
    'key+ as.png-thumbnail.png'

    >>> get_resized_image_key('key+ as', 'png')
    Traceback (most recent call last):
    AssertionError
    """
    pattern = re.compile(f'.*(?=\\.{image_type}$)')

    # Object key may have spaces or unicode non-ASCII characters.
    src_key_match = re.match(pattern, src_key)

    try:
      assert src_key_match
      file_name = src_key_match[0]
    except Exception as e:
      logger.exception(f'Unable to retrieve image data from file: {src_key}', exc_info=e)
      raise e

    dst_key: str  = f'{file_name}-thumbnail.{image_type}'

    return dst_key

def resize_image(image_body: bytes, image_type: str):
    """Resets thumbnail size to specified size"""
    try:
        img = Image.open(BytesIO(image_body))
        size = tuple([int(size/5) for size in img.size])
        img = img.resize(size, Image.ANTIALIAS)

        mybuffer = BytesIO()
        img.save(mybuffer, format=image_type.upper())
        mybuffer.seek(0)
        return mybuffer
    except Exception as ex:
        logger.exception('Could not resize image')
        raise ex

def upload_resized_image(dst_key: str, resized: BytesIO):
    destparams = {
        'Bucket': DESTINATION_BUCKET,
        'Key': dst_key,
        'Body': resized,
        'ContentType': 'image'
      }
    s3.put_object(**destparams)

def lambda_handler(event, context):
    print(f'EVENT:\n', event)

    s3_object: dict = event['Records'][0]['s3']
    src_key = s3_object['object']['key']
    src_bucket = s3_object['bucket']['name']
    image_type = get_image_type(src_key)
    resized_key = get_resized_image_key(src_key, image_type)

    try:
        orig_image: dict = s3.get_object(Bucket=src_bucket, Key=src_key)
        image_body: bytes = orig_image['Body'].read()
    except KeyError as ex:
        logger.exception('Something went wrong, image does not exist', exc_info=ex)
        raise ex

    resized_image_bytes = resize_image(image_body, image_type)
    upload_resized_image(resized_key, resized_image_bytes)
    logger.info(
      f'Successfully resized {src_bucket}/{src_key} '
      f'and uploaded to {DESTINATION_BUCKET}/{resized_key}'
    )

    s3.delete_object(Bucket=src_bucket, Key=src_key)
    logger.info('Deleted Full Sized Image')

    return {
      'resizedKey': resized_key,
      's3Location': DESTINATION_BUCKET
    }