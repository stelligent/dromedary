#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

if [ -n "$1" ]; then
    dromedary_artifact="$1"
fi

if [ -z "$dromedary_artifact" ]; then
    echo "Fatal: \$dromedary_artifact not specified" >&2
    exit 1
fi

app_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
vpc="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')"
app_instance_profile="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"
app_instance_role="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceRole`].OutputValue')"
app_ddb_table="$(aws cloudformation describe-stacks --stack-name $dromedary_ddb_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`TableName`].OutputValue')"
app_custom_action_provider_name="DromedaryJnkns$(date +%s)"

dromedary_app_stack_name="$dromedary_hostname-$(basename $dromedary_artifact .tar.gz)"
aws cloudformation create-stack \
    --disable-rollback \
    --stack-name $dromedary_app_stack_name \
    --template-body file://./pipeline/cfn/app-instance.json \
    --parameters ParameterKey=Ec2Key,ParameterValue=$dromedary_ec2_key \
        ParameterKey=SubnetId,ParameterValue=$app_subnet_id \
        ParameterKey=VPC,ParameterValue=$vpc \
        ParameterKey=InstanceProfile,ParameterValue=$app_instance_profile \
        ParameterKey=CfnInitRole,ParameterValue=$app_instance_role \
        ParameterKey=S3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=ArtifactPath,ParameterValue=$dromedary_artifact \
        ParameterKey=DynamoDbTable,ParameterValue=$app_ddb_table \
    --tags Key=BuiltBy,Value=$dromedary_custom_action_provider

app_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_app_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_app_stack_name ($app_stack_status) failed to create properly" >&2
    exit 1
fi

echo "export dromedary_app_stack_name=$dromedary_app_stack_name" >> "$ENVIRONMENT_FILE"
