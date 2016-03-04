#!/bin/bash
. /etc/profile
set -ex

declare PENTEST_RESULTS="automated_pen_test_results.json"

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
behave_result=$(/usr/local/bin/behave --no-summary --format json.pretty > ${PENTEST_RESULTS}; echo "$?")
[ -f ${PENTEST_RESULTS} ] || \
{
    echo "Failed to find behave output file '${PENTEST_RESULTS}'." 1>&2
    exit 1
}
python report_results.py \
    --bucket demo.stelligent-continuous-security.com \
    --filename data/automated_pen_test_results.json \
    --inputfile ${PENTEST_RESULTS}
exit "${behave_result}"
