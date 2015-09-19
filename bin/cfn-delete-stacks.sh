#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

# NUKE JENKINS
aws cloudformation delete-stack --stack-name "$dromedary_jenkins_stack_name"
jenkins_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_jenkins_stack_name)"
jenkins_stack_wait=$?

if [ $jenkins_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $jenkins_stack_name ($jenkins_stack_status) failed to delete properly" >&2
    exit 1
fi

# NUKE VPC & IAM
aws cloudformation delete-stack --stack-name "$dromedary_iam_stack_name"
aws cloudformation delete-stack --stack-name "$dromedary_vpc_stack_name"

iam_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_iam_stack_name)"
iam_stack_wait=$?

vpc_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_vpc_stack_name)"
vpc_stack_wait=$?
echo

if [ $vpc_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $vpc_stack_name ($vpc_stack_status) failed to delete properly" >&2
    exit 1
fi

if [ $iam_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $iam_stack_name ($iam_stack_status) failed to delete properly" >&2
    exit 1
fi
