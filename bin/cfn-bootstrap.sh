#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

stack_basename="$1"
if [ -z "$stack_basename" ]; then
    echo "Usage: $(basename $0) <stack-basename>" >&2
    exit 1
fi
vpc_stack_name="$stack_basename-vpc"
iam_stack_name="$stack_basename-iam"
jenkins_stack_name="$stack_basename-jenkins"
eni_stack_name="$stack_basename-eni"
ddb_stack_name="$stack_basename-ddb"
pipeline_stack_name="$stack_basename-pipeline"
pipeline_deploy_stack_name="$stack_basename-pipeline-deploy"
pipeline_customactions_stack_name="$stack_basename-customactions"
codedeploy_config_name="$stack_basename-deploymentconfig"
codedeploy_app_name="$stack_basename-app"

echo The value of arg pipeline_stack_name = $pipeline_stack_name
echo The value of arg pipeline_deploy_stack_name = $pipeline_deploy_stack_name


aws cloudformation create-stack \
    --stack-name $ddb_stack_name \
    --template-body file://./pipeline/cfn/dynamodb.json

aws cloudformation create-stack \
    --stack-name $vpc_stack_name \
    --template-body file://./pipeline/cfn/vpc.json

aws cloudformation create-stack \
    --stack-name $iam_stack_name \
    --capabilities CAPABILITY_IAM \
    --template-body file://./pipeline/cfn/iam.json

vpc_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $vpc_stack_name)"
vpc_stack_wait=$?
iam_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $iam_stack_name)"
iam_stack_wait=$?
ddb_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $ddb_stack_name)"
ddb_stack_wait=$?

echo

if [ $vpc_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $vpc_stack_name ($vpc_stack_status) failed to create properly" >&2
    exit 1
fi

if [ $iam_stack_wait -ne 0 ]; then
    echo "Fatal: IAM stack $iam_stack_name ($iam_stack_status) failed to create properly" >&2
    exit 1
fi

if [ $ddb_stack_wait -ne 0 ]; then
    echo "Fatal: DDB stack $ddb_stack_name ($ddb_stack_status) failed to create properly" >&2
    exit 1
fi

jenkins_subnet_id="$(aws cloudformation describe-stacks --stack-name $vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
jenkins_secgrp_id="$(aws cloudformation describe-stacks --stack-name $vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`JenkinsSecurityGroup`].OutputValue')"
jenkins_instance_profile="$(aws cloudformation describe-stacks --stack-name $iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"

echo "export dromedary_vpc_stack_name=$vpc_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_iam_stack_name=$iam_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_ddb_stack_name=$ddb_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_jenkins_stack_name=$jenkins_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_eni_stack_name=$eni_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_ec2_key=$DROMEDARY_EC2_KEY" >> "$ENVIRONMENT_FILE"
echo "export dromedary_pipeline_stack_name=$pipeline_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_pipeline_codedeploy_stack_name=$pipeline_deploy_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_codedeploy_config_name=$codedeploy_config_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_codedeploy_app_name=$codedeploy_app_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_pipeline_customactions_stack_name=$pipeline_customactions_stack_name" >> "$ENVIRONMENT_FILE"
