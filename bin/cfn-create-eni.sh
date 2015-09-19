#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

eni_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"


aws cloudformation create-stack \
    --stack-name $dromedary_eni_stack_name \
    --template-body file://./pipeline/cfn/app-eni.json \
    --disable-rollback \
    --parameters ParameterKey=Hostname,ParameterValue=$dromedary_hostname \
        ParameterKey=Domain,ParameterValue=${dromedary_domainname}. \
        ParameterKey=SubnetId,ParameterValue=$eni_subnet_id \
        ParameterKey=SecurityGroupId,ParameterValue=

eni_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_eni_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_eni_stack_name ($eni_stack_status) failed to create properly" >&2
    exit 1
fi
