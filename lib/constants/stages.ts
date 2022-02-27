import { AwsAccountInfo, AwsRegion } from '../types';

export enum StageType {
  BETA = 'beta',
}

export type Stage = {
  stageName: StageType;
  account: AwsAccountInfo;
};

export const STAGES: Stage[] = [
  {
    stageName: StageType.BETA,
    account: {
      id: '928182438953',
      region: AwsRegion.US_WEST_1,
    },
  },
];
