#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

# NUKE ENI
aws cloudformation delete-stack --stack-name "$dromedary_eni_stack_name"

eni_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_eni_stack_name)"
eni_stack_wait=$?
echo

if [ $eni_stack_wait -ne 0 ]; then
    echo "Fatal: VPC stack $eni_stack_name ($eni_stack_status) failed to delete properly" >&2
    exit 1
fi
