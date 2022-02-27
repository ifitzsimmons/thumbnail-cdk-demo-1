export enum AwsRegion {
  US_EAST_1 = 'us-east-1',
  US_WEST_1 = 'us-west-1',
  US_WEST_2 = 'us-west-2',
}

export type AwsAccountInfo = {
  id: string;
  region: AwsRegion;
};
