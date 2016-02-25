#!/bin/bash
. /etc/profile
set -ex

. environment.sh

zap_host="$(aws cloudformation describe-stacks --stack-name "$dromedary_zap_stack_name" --output text --query 'Stacks[0].Outputs[?OutputKey==`ZapURL`].OutputValue')"
dest_host="$(aws cloudformation describe-stacks --stack-name "$dromedary_app_stack_name" --output text --query 'Stacks[0].Outputs[?OutputKey==`PublicDns`].OutputValue')"
if [ -z "$dest_host" ]; then
    echo "Empty destination host!" >&2
    exit 1
fi
export TARGET_URL=http://$dest_host:8080

pushd pen_test_app
python pen-test-app.py \
    --zap-host ${zap_host} \
    --target ${TARGET_URL}
behave_result=$(/usr/local/bin/behave -f json.pretty > automated_pen_test_results.json; echo "$?")
aws s3 cp automated_pen_test_results.json s3://dromedary-test-results/data/
exit "${behave_result}"
