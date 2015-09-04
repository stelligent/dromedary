#!/bin/bash -e

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

if [ -n "$1" ]; then
    dromedary_artifact="$1"
fi

if [ -z "$dromedary_artifact" ]; then
    echo "Fatal: \$dromedary_artifact not specified" >&2
    exit 1
fi

app_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
app_secgrp_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`JenkinsSecurityGroup`].OutputValue')"
app_instance_profile="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"
app_instance_role="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceRole`].OutputValue')"
app_custom_action_provider_name="DromedaryJnkns$(date +%s)"

dromedary_app_stack_name=$(basename $dromedary_artifact .tar.gz)
aws cloudformation create-stack \
    --stack-name $dromedary_app_stack_name \
    --template-body file://./pipeline/cfn/app-instance.json \
    --parameters ParameterKey=Ec2Key,ParameterValue=$dromedary_ec2_key \
        ParameterKey=SubnetId,ParameterValue=$app_subnet_id \
        ParameterKey=SecurityGroupId,ParameterValue=$app_secgrp_id \
        ParameterKey=InstanceProfile,ParameterValue=$app_instance_profile \
        ParameterKey=CfnInitRole,ParameterValue=$app_instance_role \
        ParameterKey=S3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=ArtifactPath,ParameterValue=$dromedary_artifact \

app_stack_status="$(wait_for_stack $dromedary_app_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_app_stack_name ($app_stack_status) failed to create properly" >&2
    exit 1
fi

echo "export dromedary_custom_action_provider=$app_custom_action_provider_name" >> "$ENVIRONMENT_FILE"
