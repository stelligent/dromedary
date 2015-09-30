#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

vpc_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')"
subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
# borrowing security group from Jenkins
sg_id="$(aws cloudformation describe-stacks --stack-name $dromedary_jenkins_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SecurityGroup`].OutputValue')"

set -x

cd "$(dirname "$0")/.."
npm install
gulp dist
packer build \
    -var "vpc_id=$vpc_id" \
    -var "subnet_id=$subnet_id" \
    -var "sg_id=$sg_id" \
    -var "ami_name=dromedary_ami_created_`date +%Y%m%d%H%M%S`" \
    -var "dist_dir=dist/" \
    cookbooks/dromedary/packer.json
