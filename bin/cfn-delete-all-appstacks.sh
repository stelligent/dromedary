#!/usr/bin/env bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

vpc_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')"

app_stacks=$(aws ec2 describe-instances \
    --filters Name=vpc-id,Values=$vpc_id Name=tag:aws:cloudformation:logical-id,Values=WebServerInstance \
    --output=text --query 'Reservations[].Instances[].Tags[?Key==`aws:cloudformation:stack-name`].Value')

for stack in $(echo $app_stacks); do
    aws cloudformation delete-stack --stack-name "$stack"
done

for stack in $(echo $app_stacks); do
    stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $stack)"
    stack_wait_rc=$?
    if [ $stack_wait_rc -ne 0 ]; then
        echo "Fatal: VPC stack $stack_name ($stack_status) failed to delete properly" >&2
        exit 1
    fi
done
