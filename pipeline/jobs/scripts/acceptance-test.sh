#!/bin/bash -ex

. environment.sh

dest_host="$(aws cloudformation describe-stacks --stack-name $(basename $dromedary_artifact .tar.gz) --output text --query 'Stacks[0].Outputs[?OutputKey==`PublicDns`].OutputValue')"
export TARGET_URL=http://$dest_host:8080

npm install
gulp test-functional
