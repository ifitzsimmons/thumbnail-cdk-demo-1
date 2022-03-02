# Manual Tests with the CDK Demo

This application will create an AWS CodePipeline with one "alpha" stage. The alpha stage deploys two CloudFormation Stacks. One stack will convert any image
dropped into the ingestion bucket into a thumbnail image in the destination bucket. The other stack creates a Lambda that will be used to test the thumbnail creation service on demand.

## Get Started
You'll need to make a few modifications to get this application up and running in your own AWS account.

### Create a GitHub Connection via the AWS Console
One of the easiest ways to set up the pipeline source is to create a GitHub connection via the AWS CodePipeline Console.
1. Fork this repository.
1. [Create a GitHub connection](https://docs.aws.amazon.com/codepipeline/latest/userguide/connections-github.html#connections-github-console) via the CodePipeline console
1. Navigate to the [pipeline constants](lib/constants/pipeline.ts) file and change the `GitHubConstants` constants object by performing the following:
```diff
export const GitHubConstants = {
-  repo: 'ifitzsimmons/cdk-pipeline-with-e2e',
+  repo: '<github-username>/cdk-pipeline-with-e2e'
  branch: 'main',
  connection:
-    'arn:aws:codestar-connections:us-east-1:928182438953:connection/d55151b5-59a4-4724-918b-58113828ef8b',
+    '<connection-arn-from-step-2>'
};
```

### Change the Bucket prefix
Since S3 is a global service and every bucket must have a unique name, we must make sure that our buckets don't all have the same name.
1. Go to [pipeline constants](lib/constants/pipeline.ts) file and chane the `BUCKET_PREFIX` constant to whatever you want. The ingestion and destination bucket will be prefixed with whatever string you choose.
```diff
- export const BUCKET_PREFIX = 'ianfitz';
+ export const BUCKET_PREFIX = '<something-unique>'
```

### Create a test artifact bucket
In order to test our thumbnail generator, we'll need a bucket to store a test image.

1. Create a bucket within your account that you'll use to store your test image(s)
1. Name your test image "replaceme.jpeg"
1. Navigate to the [thumbnail-testing-cdk-stack](lib/thumbnail-testing-cdk-stack.ts) file and make the following change:
```diff
- testArtifactBucketName = 'thumbnail-test-artifacts';
+ testArtifactBucketName = '<your-artifact-bucket-name>';
```

Note: The first time you run your test, it will probably fail. After running your test image through the thumbnail generator, you'll need to update the thumbnail's expected size in the [ThumbnailDriver](src/lambda/CreateThumbnailDriver/createThumbnailDriver.py).

## Deploy
After going through the steps in the [Get Started](#get-started) section, run the following commands from the command line to deploy your pipeline and all resources to your AWS Account.

```bash
$ npm ci
$ cdk synth
$ cdk bootstrap
$ cdk deploy ThumbnailCdkPipelineStack
```

After the pipeline is deployed, commit your changed and push to your fork's main branch to kick off the build:
```bash
$ git add . && git commit -m "Initial commit"
$ git push
```

If you navigate to your pipeline (deployed in `us-west-2`), you should see a new build was triggered by the git push.

## Test
Navigate to the `ThumbnailTestStack` in `us-east-2`. Find the `TestImageProcessor-us-east-2` Lambda function and click Test.

Again, please note that the test may fail due to unexpected thumbnail size. Once you have determined the expected thumbnail size for your test image, change the `EXPECTED_THUMNBAIL_SIZE` in the [ThumbnailDriver](src/lambda/CreateThumbnailDriver/createThumbnailDriver.py). Remember that the units are **Bytes**.


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
