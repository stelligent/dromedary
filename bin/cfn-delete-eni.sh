#!/bin/bash
set -e

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

# NUKE ENI
aws cloudformation delete-stack --stack-name "$dromedary_eni_stack_name"

eni_stack_status="$(wait_for_stack $dromedary_eni_stack_name)"
eni_stack_wait=$?
echo

if [ $eni_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $eni_stack_name ($eni_stack_status) failed to delete properly" >&2
    exit 1
fi
