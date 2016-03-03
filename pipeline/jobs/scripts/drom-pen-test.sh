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
python report_results.py \
    --bucket demo.stelligent-continious-security.com \
    --filename data/automated_pen_test_results.json
exit "${behave_result}"
