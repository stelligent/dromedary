#!/bin/bash
. /etc/profile
set -x

. ./environment.sh

function publish_results () {
    cat << EOF > sec_int_test_job_info.json
{ "JOB_NAME": "$1", "BUILD_NUMBER": "$2", "BUILD_ID": "$3", "BUILD_URL": "$4"}
EOF
    aws s3 cp sec_int_test_results.json s3://demo.stelligent-continuous-security.com/data/sec_int_test_results.json
    aws s3 cp sec_int_test_job_info.json s3://demo.stelligent-continuous-security.com/data/sec_int_test_job_info.json
}

pushd test-security-integration
gem install rspec:3.4.0 aws-sdk:2.2.25
rspec
TEST_RESULT=$?
publish_results $1 $2 $3 $4
popd
exit ${TEST_RESULT}


