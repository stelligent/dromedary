#!/bin/bash
. /etc/profile
set -ex

. environment.sh

dest_host="$(aws cloudformation describe-stacks --stack-name "$dromedary_app_stack_name" --output text --query 'Stacks[0].Outputs[?OutputKey==`PublicDns`].OutputValue')"
if [ -z "$dest_host" ]; then
    echo "Empty destination host!" >&2
    exit 1
fi
export TARGET_URL=http://$dest_host:8080

npm install
gulp test-functional
