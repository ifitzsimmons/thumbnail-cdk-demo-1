from os.path import abspath, dirname, join
import os
import sys
from io import StringIO
import pytest

lambda_path = join(dirname(abspath(__file__)), '../lambda')
sys.path.insert(0, lambda_path)
os.environ['DestinationBucket'] = 'DstBucket'
os.environ['SourceBucket'] = 'SrcBucket'
os.environ['TestArtifactBucket'] = 'TestArtifactBucket'

@pytest.fixture()
def s3_get_object_return() -> dict:
    return_obj = dict(Body='jhigahjdshjk')

    return return_obj

@pytest.fixture()
def s3_trigger_event() -> dict:
    event = {
      "Records": [
        {
          "s3": {
            "bucket": {"name": "srcBucket"},
            "object": {"key": "srcKey.png"}
          }
        }
      ]
    }

    return event

@pytest.fixture()
def mock_s3_get():
    return dict(Body=StringIO('jhigahjdshjk'))

