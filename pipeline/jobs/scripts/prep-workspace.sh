#!/bin/bash -ex

# since the workspace is maintained throughout the build,
# install dependencies now in a clear workspace
rm -rf node_modules dist
npm install

echo "export dromedary_s3_bucket=$DROMEDARY_S3_BUCKET" > environment.sh
echo "export dromedary_vpc_stack_name=$DROMEDARY_VPC_STACK" >> environment.sh
echo "export dromedary_iam_stack_name=$DROMEDARY_IAM_STACK" >> environment.sh
echo "export dromedary_ec2_key=$DROMEDARY_EC2_KEY" >> environment.sh
