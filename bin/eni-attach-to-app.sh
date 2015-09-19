#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

app_stack=$1
if [ -z "$app_stack" ]; then
    echo "Usage: $(basename $0) <app_stack>" >&2
    exit 1
fi

set -x

eni_id="$(aws cloudformation describe-stacks --stack-name $dromedary_eni_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`EniId`].OutputValue')"
attachment_id="$(aws ec2 describe-network-interfaces --network-interface-ids $eni_id --output text --query 'NetworkInterfaces[0].Attachment.AttachmentId')"
instance_id="$(aws cloudformation describe-stacks --stack-name $app_stack --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue')"
sec_grp_id="$(aws cloudformation describe-stacks --stack-name $app_stack --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceSecurityGroup`].OutputValue')"

# update ENI stack with new security-group
aws cloudformation update-stack \
    --stack-name $dromedary_eni_stack_name \
    --template-body file://$script_dir/../pipeline/cfn/app-eni.json \
    --parameters ParameterKey=Hostname,UsePreviousValue=true \
        ParameterKey=Domain,UsePreviousValue=true \
        ParameterKey=SubnetId,UsePreviousValue=true \
        ParameterKey=SecurityGroupId,ParameterValue=$sec_grp_id

eni_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_eni_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_eni_stack_name ($eni_stack_status) failed to create properly" >&2
    exit 1
fi

# detach from existing instance
if [ -n "$attachment_id" -a "$attachment_id" != 'None' ]; then
    aws ec2 detach-network-interface --attachment-id $attachment_id
fi
# wait for detachment
while [ -n "$attachment_id" -a "$attachment_id" != 'None' ]; do
    sleep 1
    attachment_id="$(aws ec2 describe-network-interfaces --network-interface-ids $eni_id --output text --query 'NetworkInterfaces[0].Attachment.AttachmentId')"
done

# attach to new instance
aws ec2 attach-network-interface --network-interface-id $eni_id --instance-id $instance_id --device-index 1 --output=json
