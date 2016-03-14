#!/bin/bash
#. /etc/profile
set -e

ruby -v

gem install trusted-advisor-status --version 0.0.4 \
                                   --conservative

trusted-advisor-status > full_trusted_advisor_results.json

aws s3api put-object --bucket demo.stelligent-continuous-security.com \
                     --key 'data/full_trusted_advisor_results.json' \
                     --body full_trusted_advisor_results.json \
                     --region us-east-1
