#!/bin/bash
. /etc/profile
set -e

ruby -v

gem install cfn-nag --version 0.0.8 \
                    --conservative

set +e
templates_to_audit=pipeline/cfn/dromedary-master.json
#templates_to_audit=pipeline/cfn/

cfn_nag --input-json-path ${templates_to_audit} \
        --output-format json > cfn_nag_results.json
cfn_nag_result=$?

set -e
aws s3api put-object --bucket dromedary-test-results \
                     --key 'data...tests_result_data_to_be_specific/cfn_nag_results.json' \
                     --body cfn_nag_results.json

exit ${cfn_nag_result}