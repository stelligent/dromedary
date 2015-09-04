#!/bin/bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

wait_for_stack() {
    stack_name="$1"
    stack_status='UNKNOWN_IN_PROGRESS'

    echo "Waiting for $stack_name to delete ..." >&2
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

vpc_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')"

app_stacks=$(aws ec2 describe-instances \
    --filters Name=vpc-id,Values=$vpc_id Name=tag:aws:cloudformation:logical-id,Values=WebServerInstance \
    --output=text --query 'Reservations[].Instances[].Tags[?Key==`aws:cloudformation:stack-name`].Value')

for stack in $(echo $app_stacks); do
    aws cloudformation delete-stack --stack-name "$stack"
done

for stack in $(echo $app_stacks); do
    stack_status="$(wait_for_stack $stack)"
    stack_wait_rc=$?
    if [ $stack_wait_rc -ne 0 ]; then
        echo "Fatal: VPC stack $stack_name ($stack_status) failed to delete properly" >&2
        exit 1
    fi
done
