## Contents
- [Application Resources](#application-resources)
- [Application Deployment](#stack-deployment)
- [Testing](#testing)
- [Dependencies](#dependencies)

This repository will serve as an example for an AWS Serverless application with unit tests written in `pytest` and `tox`.

This project will take an image uploaded to the `SourceBucket`, re-size it in the [CreateThumbnail](lambda/CreateThumbnail/index.py) Lambda function, and then upload the image to the `DestinationBucket`.

Because this project primarily serves as an example for others on ways to test serverless applications locally, please ignore the lack of DocStrings and any other python faux pas. In addition to that, I am not an expert on testing python serverless applications, so if you have suggestions or improvements, I'd love to hear about them. I try to operate under the assumption that not everyone has the `aws-sam-cli` available to them, and if that's the case, running tests locally can be difficult.

This serverless app contains one Lamba Function, two S3 Buckets, and a lambda layer laid out with the following file tree.
```
.
├── lambda
│   └── CreateThumbnail
│       └── index.py
├── layers
│   └── myLayer
│       └── python
│           └── lib
│               └── python3.8
│                   └── site-packages
│                           └── dependencies
├── tests
│   ├── conftest.py
│   └── test_CreateThumbnail.py
├── README.md
├── template.yaml
└── tox.ini
```
I like keeping my `tests` folder outside of my application code, but there's nothing stopping you from throwing your `tests` directory inside the `lambda` folder. In fact, some applications that I have worked on have AWS Glue jobs and Lambda functions in the same stack, and I'll often put one test folder inside the `lambda` directory and the other in the `glue` directory.
## Application Resources
The stack is defined by the [template.yaml](template.yaml) file and has the following resources.
#### SourceBucket
The source bucket serves as a trigger for the `CreateThumbnail` Lambda functions. When you upload a file to the `SourceBucket` the lambda will run and, if all goes well, create a thumbnail for the uploaded image.

#### DestinationBucket
The `DestinationBucket` will store the new, thumbnailed (I know that's not a word) version of the image you uploaded.
#### CreateThumbnail
The CreateThumbnail Lambda function is triggered by an upload to the S3 `SourceBucket`. Any file with a `.jpg`, `.jpeg`, or `.png` extension will be condensed to a thumbnail and uploaded to the `DestinationBucket` with a prefix of "resized-\<image-name\>.

#### MyLayer
Lambda layers can be used to install third party dependencies. I have taken the steps to install the `pillow` package within a Amazon-python3.8 linux container so the lambda can successfully use the package to modify the image. There are ways to use makefiles to package your layers, and I suggest you look into them if you're interested. If you have control of your CI/CD flow (I hope you do), you can install these dependencies at run time rather than storing them statically in your git repo.

## Stack Deployment
To deploy your stack to your AWS account run the following commands in order.
```bash
aws cloudformation package \
  -t template.yaml \
  --s3-bucket <your-bucket> \
  --s3-prefix <your-prefix> \
  --output-template-file template.pkg.yaml
```
```bash
sam deploy \
  -t template.pkg.yaml \
  --stack-name image-resizer \
  --s3-bucket <your-bucket> \
  --s3-prefix <your-prefix> \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```
Note that the Cloudformation Stack Name is set to "image-resizer"

## Testing
### Unit Tests
This application uses a combination of `tox` and `pytest` to orchestrate the unit tests. The primary purpose of this project is to show potential solutions to local testing of serverless applications. The tests will all be stored in the [tests](tests) directory. To run the unit test(s), you can run either one of the following two commands:
1. `$ tox`
2. `$ python -m pytest`

The first command will create a virtual environment that can be reused by executing `$ tox -e py38` from the command line and will include all test dependencies (for more info, checkout the `tox.ini` file). The second command will run the unit tests locally, so make sure you have all of the [dependencies](#dependencies) installed.


## Dependencies
* `python@3.8`: Not mandatory, but the project is deployed to python3.8 lambdas.
* `boto3`
* `pillow`
* `pytest`
* `tox`