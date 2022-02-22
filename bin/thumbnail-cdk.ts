#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ThumbnailCdkStack } from '../lib/thumbnail-cdk-stack';

const app = new cdk.App();
new ThumbnailCdkStack(app, 'ThumbnailCdkStack');
