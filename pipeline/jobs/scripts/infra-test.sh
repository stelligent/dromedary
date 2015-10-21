#!/bin/bash
. /etc/profile
set -ex

. ./environment.sh

gem install rspec aws-sdk
pushd test-infra
export dromedary_security_group="$(aws cloudformation describe-stack-resources --region us-east-1 --stack-name $dromedary_app_stack_name  --query StackResources[?LogicalResourceId==\`InstanceSecurityGroup\`].PhysicalResourceId --output text)"
rspec
popd
