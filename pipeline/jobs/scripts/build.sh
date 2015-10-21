#!/bin/bash
. /etc/profile
set -ex

# setup environment.sh
if [ -n "$AWS_DEFAULT_REGION" ]; then
    echo "export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION" > environment.sh
else
    echo "export AWS_DEFAULT_REGION=us-east-1" > environment.sh
fi
echo "export dromedary_s3_bucket=$DROMEDARY_S3_BUCKET" >> environment.sh
echo "export dromedary_vpc_stack_name=$DROMEDARY_VPC_STACK" >> environment.sh
echo "export dromedary_iam_stack_name=$DROMEDARY_IAM_STACK" >> environment.sh
echo "export dromedary_ddb_stack_name=$DROMEDARY_DDB_STACK" >> environment.sh
echo "export dromedary_eni_stack_name=$DROMEDARY_ENI_STACK" >> environment.sh
echo "export dromedary_ec2_key=$DROMEDARY_EC2_KEY" >> environment.sh
echo "export dromedary_hostname=$DROMEDARY_HOSTNAME" >> environment.sh
echo "export dromedary_domainname=$DROMEDARY_DOMAINNAME" >> environment.sh
echo "export dromedary_zone_id=$DROMEDARY_ZONE_ID" >> environment.sh
echo "export dromedary_artifact=dromedary-$(date +%Y%m%d-%H%M%S).tar.gz" >> environment.sh
echo "export dromedary_custom_action_provider=$DROMEDARY_ACTION_PROVIDER" >> environment.sh

. environment.sh

# since the workspace is maintained throughout the build,
# install dependencies now in a clear workspace
rm -rf node_modules dist
npm install

# build and upload artifact
gulp dist
aws s3 cp dist/archive.tar.gz s3://$dromedary_s3_bucket/$dromedary_artifact
