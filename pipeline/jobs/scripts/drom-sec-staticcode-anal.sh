#!/bin/bash
. /etc/profile
set -e

ruby -v

necessary_env_vars=(JOB_NAME BUILD_NUMBER BUILD_ID BUILD_URL)
for necessary_env_var in "${necessary_env_vars[@]}";
do
  if [[ -z ${!necessary_env_var} ]];
  then
    echo The env var: ${necessary_env_var} must be set!
    exit 1
  fi
done

gem install cfn-nag --version 0.0.10 \
                    --conservative

set +e
templates_to_audit=pipeline/cfn/app-instance.json
#templates_to_audit=pipeline/cfn/

cfn_nag --input-json-path ${templates_to_audit} \
        --output-format json > cfn_nag_results_raw.json
cfn_nag_result=$?

set -e
set -o pipefail
cat cfn_nag_results_raw.json | \
  jq '{ result: (if ([.[]|.file_results.failure_count]|reduce .[] as $item (0; . + $item)) > 0 then "FAIL" else "PASS" end), results: .}' > aggregate_status_cfn_nag_results.json

cat aggregate_status_cfn_nag_results.json | \
  jq '{ result: .result, results: [.results[]|.filename as $filename|.file_results.violations[]|.filename=$filename]|sort_by(.type)}' > cfn_nag_results.json

aws s3api put-object --bucket demo.stelligent-continuous-security.com \
                     --key 'data/cfn_nag_results.json' \
                     --body cfn_nag_results.json \
                     --region us-east-1

cat << EOF > sec_staticcode_anal_job_info.json
{ "JOB_NAME": "${JOB_NAME}", "BUILD_NUMBER": "${BUILD_NUMBER}", "BUILD_ID": "${BUILD_ID}", "BUILD_URL": "${BUILD_URL}"}
EOF

aws s3api put-object --bucket demo.stelligent-continuous-security.com \
                     --key 'data/sec_staticcode_anal_job_info.json' \
                     --body sec_staticcode_anal_job_info.json \
                     --region us-east-1

exit ${cfn_nag_result}