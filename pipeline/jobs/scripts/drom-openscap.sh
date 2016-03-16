#!/bin/bash
. /etc/profile
set -ex

. environment.sh

dest_host="$(aws cloudformation describe-stacks --stack-name "${dromedary_app_stack_name}" \
                                                --output text \
                                                --query 'Stacks[0].Outputs[?OutputKey==`PublicDns`].OutputValue')"


aws s3 cp "s3://demo.stelligent-continuous-security.com/${dest_host}-oscap-results.xml" \
          oscap-results.xml

failure_count=$(xmllint --xpath "count(//*[namespace-uri()='http://checklists.nist.gov/xccdf/1.1' and local-name()='rule-result'][*[local-name()='result'][text()='fail']])" \
                        oscap-results.xml)

exit ${failure_count}