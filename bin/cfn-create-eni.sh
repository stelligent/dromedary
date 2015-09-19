#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

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

eni_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"

aws cloudformation create-stack \
    --stack-name $dromedary_eni_stack_name \
    --template-body file://./pipeline/cfn/app-eni.json \
    --disable-rollback \
    --parameters ParameterKey=SubnetId,ParameterValue=$eni_subnet_id \
        ParameterKey=SecurityGroupId,ParameterValue=

eni_stack_status="$(wait_for_stack $dromedary_eni_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_eni_stack_name ($eni_stack_status) failed to create properly" >&2
    exit 1
fi
