#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

eni_id="$(aws cloudformation describe-stacks --stack-name $dromedary_eni_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`EniId`].OutputValue')"
attachment_id="$(aws ec2 describe-network-interfaces --network-interface-ids $eni_id --output text --query 'NetworkInterfaces[0].Attachment.AttachmentId')"

if [ -n "$attachment_id" -a "$attachment_id" != 'None' ]; then
    aws ec2 detach-network-interface --attachment-id $attachment_id
fi
