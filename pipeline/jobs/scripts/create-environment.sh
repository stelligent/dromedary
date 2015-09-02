#!/bin/bash -ex

subnet_id=UNKNOWN_SUBNET_ID
secgrp_id=UNKNOWN_SECGRP_ID
instance_profile=UNKNOWN_INSTANCE_PROFILE
stack_name="dromeday-app-$(date +%Y%m%d-%H%M%S)"

ls -l dist
echo aws cloudformation create-stack \
    --stack-name $stack_name \
    --template-body file://./pipeline/cfn/app-instance.json \
    --parameters ParameterKey=Ec2Key,ParameterValue=vrivellino-labs \
        ParameterKey=SubnetId,ParameterValue=$subnet_id \
        ParameterKey=SecurityGroupId,ParameterValue=$secgrp_id \
        ParameterKey=InstanceProfile,ParameterValue=$instance_profile
