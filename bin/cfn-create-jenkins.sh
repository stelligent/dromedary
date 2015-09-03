#!/bin/bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

wait_for_stack() {
    stack_name="$1"
    stack_status='UNKNOWN_IN_PROGRESS'

    echo "Waiting for $stack_name to settle ..." >&2
    while [[ $stack_status =~ IN_PROGRESS$ ]]; do
        sleep 5
        stack_status="$(aws cloudformation describe-stacks --stack-name "$1" --output text --query 'Stacks[0].StackStatus')"
        echo " ... $stack_name - $stack_status" >&2
    done
    echo $stack_status
    # if status is failed or we'd rolled back, assume bad things happened
    if [[ $stack_status =~ _FAILED$ ]] || [[ $stack_status =~ ROLLBACK ]]; then
        return 1
    fi
    return 0
}

jenkins_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
jenkins_secgrp_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`JenkinsSecurityGroup`].OutputValue')"
jenkins_instance_profile="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"
jenkins_instance_role="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceRole`].OutputValue')"
jenkins_custom_action_provider_name="DromedaryJnkns$(date +%s)"

temp_dir=$(mktemp -d /tmp/dromedary.XXXX)
config_dir="$(dirname $0)/../pipeline/jobs/xml"

cp -r $config_dir/* $temp_dir/
pushd $temp_dir > /dev/null
for f in */config.xml; do
    sed s/DromedaryJenkins/$jenkins_custom_action_provider_name/ $f > $f.new && mv $f.new $f
done
sed s/S3BUCKET_PLACEHOLDER/$dromedary_s3_bucket/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml
sed s/VPC_PLACEHOLDER/$dromedary_vpc_stack_name/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml
sed s/IAM_PLACEHOLDER/$dromedary_iam_stack_name/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml
sed s/DROMEDARY_HOSTNAME/$dromedary_hostname/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml
sed s/DROMEDARY_DOMAINNAME/$dromedary_domainname/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml
sed s/DROMEDARY_ZONE_ID/$dromedary_zone_id/ prep-workspace/config.xml > prep-workspace/config.xml.new && mv prep-workspace/config.xml.new prep-workspace/config.xml

tar czf job-configs.tgz *
aws s3 cp job-configs.tgz s3://$dromedary_s3_bucket/jenkins-job-configs.tgz
popd > /dev/null
rm -rf $temp_dir

if ! aws s3 ls s3://$dromedary_s3_bucket/jenkins-job-configs.tgz; then
    echo "Fatal: Unable to upload Jenkins job configs to s3://$dromedary_s3_bucket/jenkins-job-configs.tgz" >&2
    exit 1
fi

aws cloudformation create-stack \
    --stack-name $dromedary_jenkins_stack_name \
    --template-body file://./pipeline/cfn/jenkins-instance.json \
    --parameters ParameterKey=Ec2Key,ParameterValue=$dromedary_ec2_key \
        ParameterKey=SubnetId,ParameterValue=$jenkins_subnet_id \
        ParameterKey=SecurityGroupId,ParameterValue=$jenkins_secgrp_id \
        ParameterKey=InstanceProfile,ParameterValue=$jenkins_instance_profile \
        ParameterKey=S3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=CfnInitRole,ParameterValue=$jenkins_instance_role

jenkins_stack_status="$(wait_for_stack $dromedary_jenkins_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_jenkins_stack_name ($jenkins_stack_status) failed to create properly" >&2
    exit 1
fi

echo "export dromedary_custom_action_provider=$jenkins_custom_action_provider_name" >> "$ENVIRONMENT_FILE"
