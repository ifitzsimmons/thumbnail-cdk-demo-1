import { AwsAccountInfo, AwsRegion } from '../types';

export enum StageType {
  ALPHA = 'alpha',
  BETA = 'beta',
  PROD = 'prod',
}

export type Stage = {
  stageName: StageType;
  account: AwsAccountInfo;
};

export const STAGES: Stage[] = [
  {
    stageName: StageType.ALPHA,
    account: {
      id: '928182438953',
      region: AwsRegion.US_EAST_2,
    },
  },
];
