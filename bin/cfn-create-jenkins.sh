#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

jenkins_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"
jenkins_secgrp_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`JenkinsSecurityGroup`].OutputValue')"
vpc="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')"
jenkins_instance_profile="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"
jenkins_instance_role="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceRole`].OutputValue')"
jenkins_custom_action_provider_name="Jenkins$(echo $dromedary_hostname | tr '[[:lower:]]' '[[:upper:]]')$(printf "%x" $(date +%s))"

temp_dir=$(mktemp -d /tmp/dromedary.XXXX)
config_dir="$(dirname $0)/../pipeline/jobs/xml"
config_tar_path="$dromedary_jenkins_stack_name/jenkins-job-configs-$(date +%s).tgz"

cp -r $config_dir/* $temp_dir/
pushd $temp_dir > /dev/null
for f in */config.xml; do
    sed s/DromedaryJenkins/$jenkins_custom_action_provider_name/ $f > $f.new && mv $f.new $f
done
sed s/S3BUCKET_PLACEHOLDER/$dromedary_s3_bucket/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/VPC_PLACEHOLDER/$dromedary_vpc_stack_name/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/IAM_PLACEHOLDER/$dromedary_iam_stack_name/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/ENI_PLACEHOLDER/$dromedary_eni_stack_name/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/KEY_PLACEHOLDER/$dromedary_ec2_key/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/HOSTNAME_PLACEHOLDER/$dromedary_hostname/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/DOMAINNAME_PLACEHOLDER/$dromedary_domainname/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/ZONE_ID_PLACEHOLDER/$dromedary_zone_id/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml
sed s/ACTION_PROVIDER_PLACEHOLDER/$jenkins_custom_action_provider_name/ build/config.xml > build/config.xml.new && mv build/config.xml.new build/config.xml

tar czf job-configs.tgz *
aws s3 cp job-configs.tgz s3://$dromedary_s3_bucket/$config_tar_path
popd > /dev/null
rm -rf $temp_dir

if ! aws s3 ls s3://$dromedary_s3_bucket/$config_tar_path; then
    echo "Fatal: Unable to upload Jenkins job configs to s3://$dromedary_s3_bucket/$config_tar_path" >&2
    exit 1
fi

echo aws cloudformation create-stack \
    --stack-name $dromedary_jenkins_stack_name \
    --template-body file://./pipeline/cfn/jenkins-instance.json \
    --disable-rollback \
    --parameters ParameterKey=Ec2Key,ParameterValue=$dromedary_ec2_key \
        ParameterKey=SubnetId,ParameterValue=$jenkins_subnet_id \
        ParameterKey=VPC,ParameterValue=$vpc \
        ParameterKey=InstanceProfile,ParameterValue=$jenkins_instance_profile \
        ParameterKey=S3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=JobConfigsTarball,ParameterValue=$config_tar_path \
        ParameterKey=CfnInitRole,ParameterValue=$jenkins_instance_role



aws cloudformation create-stack \
    --stack-name $dromedary_jenkins_stack_name \
    --template-body file://./pipeline/cfn/jenkins-instance.json \
    --disable-rollback \
    --parameters ParameterKey=Ec2Key,ParameterValue=$dromedary_ec2_key \
        ParameterKey=SubnetId,ParameterValue=$jenkins_subnet_id \
        ParameterKey=VPC,ParameterValue=$vpc \
        ParameterKey=InstanceProfile,ParameterValue=$jenkins_instance_profile \
        ParameterKey=S3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=JobConfigsTarball,ParameterValue=$config_tar_path \
        ParameterKey=CfnInitRole,ParameterValue=$jenkins_instance_role

jenkins_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_jenkins_stack_name)"
if [ $? -ne 0 ]; then
    echo "Fatal: Jenkins stack $dromedary_jenkins_stack_name ($jenkins_stack_status) failed to create properly" >&2
    exit 1
fi

echo "export dromedary_custom_action_provider=$jenkins_custom_action_provider_name" >> "$ENVIRONMENT_FILE"
