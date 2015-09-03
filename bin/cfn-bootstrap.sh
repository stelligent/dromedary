#!/bin/bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE ... remove if you need to bootstrap!" 2>&1
    exit 1
fi

stack_basename=dromedary
if [ -n "$1" ]; then
    stack_basename="$1"
fi
vpc_stack_name="$stack_basename-vpc"
iam_stack_name="$stack_basename-iam"
jenkins_stack_name="$stack_basename-jenkins"
s3_bucket="$stack_basename-$AWS_ACCOUNT_ID"

aws s3 mb s3://$s3_bucket || exit $?

aws cloudformation create-stack \
    --stack-name $vpc_stack_name \
    --template-body file://./pipeline/cfn/vpc.json

aws cloudformation create-stack \
    --stack-name $iam_stack_name \
    --capabilities CAPABILITY_IAM \
    --template-body file://./pipeline/cfn/iam.json

wait_for_stack() {
    stack_name="$1"
    stack_status='UNKNOWN_IN_PROGRESS'

    echo "Waiting for $stack_name to settle ..." >&2
    while [[ $stack_status =~ IN_PROGRESS$ ]]; do
        sleep 5
        stack_status="$(aws cloudformation describe-stacks --stack-name "$1" --output text --query 'Stacks[0].StackStatus')"
        echo " ... $stack_name - $stack_status" >&2
    done
    echo $stack_status
    # if status is failed or we'd rolled back, assume bad things happened
    if [[ $stack_status =~ _FAILED$ ]] || [[ $stack_status =~ ROLLBACK ]]; then
        return 1
    fi
    return 0
}

vpc_stack_status="$(wait_for_stack $vpc_stack_name)"
vpc_stack_wait=$?
iam_stack_status="$(wait_for_stack $iam_stack_name)"
iam_stack_wait=$?

echo

if [ $vpc_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $vpc_stack_name ($vpc_stack_status) failed to create properly" >&2
    exit 1
fi

if [ $iam_stack_wait -ne 0 ]; then
    echo "Fatal: IAM stack $iam_stack_name ($iam_stack_status) failed to create properly" >&2
    exit 1
fi

jenkins_subnet_id="$(aws cloudformation describe-stacks --stack-name $vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
jenkins_secgrp_id="$(aws cloudformation describe-stacks --stack-name $vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`JenkinsSecurityGroup`].OutputValue')"
jenkins_instance_profile="$(aws cloudformation describe-stacks --stack-name $iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"

echo "export dromedary_vpc_stack_name=$vpc_stack_name" > "$ENVIRONMENT_FILE"
echo "export dromedary_iam_stack_name=$iam_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_jenkins_stack_name=$jenkins_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_s3_bucket=$s3_bucket" >> "$ENVIRONMENT_FILE"
echo "export dromedary_ec2_key=$DROMEDARY_EC2_KEY" >> "$ENVIRONMENT_FILE"
