#!/usr/bin/env bash
set -e

echo "In configure-jenkins.sh"
script_dir="$(dirname "$0")"
bin_dir="$(dirname $0)/../bin"

echo The value of arg 0 = $0
echo The value of arg 1 = $1 
echo The value of arg script_dir = $script_dir

uuid=$(date +%s)

pipeline_store_stackname=$1

VPCStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`VPCStackName`].OutputValue')"
IAMStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`IAMStackName`].OutputValue')"
DDBStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`DDBStackName`].OutputValue')"
ENIStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ENIStackName`].OutputValue')"
MasterStackName="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`MasterStackName`].OutputValue')"
dromedary_s3_bucket=dromedary-"$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`DromedaryS3Bucket`].OutputValue')"
dromedary_branch="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`Branch`].OutputValue')"
dromedary_ec2_key="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`KeyName`].OutputValue')"

#prod_dns_param="pmd.oneclickdeployment.com"

my_prod_dns_param="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ProdHostedZone`].OutputValue')"
prod_dns_param="$MasterStackName$my_prod_dns_param"
echo "The value of prod_dns_param is $prod_dns_param"

prod_dns="$(echo $prod_dns_param | sed 's/[.]$//')"

dromedary_hostname=$(echo $prod_dns | cut -f 1 -d . -s)
dromedary_domainname=$(echo $prod_dns | sed s/^$dromedary_hostname[.]//)

echo "dromedary_hostname is $dromedary_hostname"
echo "dromedary_domainname is $dromedary_domainname"

my_domainname="$dromedary_domainname."


if [ -z "$dromedary_hostname" -o -z "$dromedary_domainname" ]; then
    echo "Fatal: $prod_dns is an invalid hostname" >&2
    exit 1
fi

dromedary_zone_id=$(aws route53 list-hosted-zones --output=text --query "HostedZones[?Name==\`${dromedary_domainname}.\`].Id" | sed 's,^/hostedzone/,,')
if [ -z "$dromedary_zone_id" ]; then
    echo "Fatal: unable to find Route53 zone id for $dromedary_domainname." >&2
    exit 1
fi

echo "dromedary_zone_id is $dromedary_zone_id"

dromedary_vpc_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`VPCStackName`].OutputValue')"
dromedary_iam_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`IAMStackName`].OutputValue')"
dromedary_ddb_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`DDBStackName`].OutputValue')"
dromedary_eni_stack_name="$(aws cloudformation describe-stacks --stack-name $pipeline_store_stackname --output text --query 'Stacks[0].Outputs[?OutputKey==`ENIStackName`].OutputValue')"
#dromedary_eni_stack_name="ENIStack$(echo $uuid)"
jenkins_custom_action_provider_name="Jenkins$(echo $uuid)"

temp_dir=$(mktemp -d /tmp/dromedary.XXXX)
config_dir="$(dirname $0)/../pipeline/jobs/xml"
config_tar_path="$MasterStackName/jenkins-job-configs-$uuid.tgz"

echo "The value of VPCStackName is $VPCStackName"
echo "The value of IAMStackName is $IAMStackName"
echo "The value of DDBStackName is $DDBStackName"
echo "The value of ENIStackName is $ENIStackName"
echo "The value of MasterStackName is $MasterStackName"
echo "The value of dromedary_s3_bucket is $dromedary_s3_bucket"
echo "The value of dromedary_branch is $dromedary_branch"
echo "The value of dromedary_domainname is $dromedary_domainname"
echo "The value of dromedary_ec2_key is $dromedary_ec2_key"
echo "The value of dromedary_zone_id is $dromedary_zone_id"
echo "The value of dromedary_iam_stack_name is $dromedary_iam_stack_name"
echo "The value of dromedary_ddb_stack_name is $dromedary_ddb_stack_name"
echo "The value of dromedary_eni_stack_name is $dromedary_eni_stack_name"
echo "The value of jenkins_custom_action_provider_name is $jenkins_custom_action_provider_name"
echo "The value of dromedary_eni_stack_name is $dromedary_eni_stack_name"
echo "The value of my_domainname is $my_domainname"

eni_subnet_id="$(aws cloudformation describe-stacks --stack-name $dromedary_vpc_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`SubnetId`].OutputValue')"

echo "The value of eni_subnet_id is $eni_subnet_id"

cp -r $config_dir/* $temp_dir/
pushd $temp_dir > /dev/null
for f in */config.xml; do
    sed s/DromedaryJenkins/$jenkins_custom_action_provider_name/ $f > $f.new && mv $f.new $f
done
sed s/S3BUCKET_PLACEHOLDER/$dromedary_s3_bucket/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/BRANCH_PLACEHOLDER/$dromedary_branch/ job-seed/config.xml > job-seed/config.xml.new && mv job-seed/config.xml.new job-seed/config.xml
sed s/VPC_PLACEHOLDER/$dromedary_vpc_stack_name/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/IAM_PLACEHOLDER/$dromedary_iam_stack_name/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/DDB_PLACEHOLDER/$dromedary_ddb_stack_name/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/ENI_PLACEHOLDER/$dromedary_eni_stack_name/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/KEY_PLACEHOLDER/$dromedary_ec2_key/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/HOSTNAME_PLACEHOLDER/$dromedary_hostname/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/DOMAINNAME_PLACEHOLDER/$dromedary_domainname/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/ZONE_ID_PLACEHOLDER/$dromedary_zone_id/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml
sed s/ACTION_PROVIDER_PLACEHOLDER/$jenkins_custom_action_provider_name/ drom-build/config.xml > drom-build/config.xml.new && mv drom-build/config.xml.new drom-build/config.xml

tar czf job-configs.tgz *
aws s3 cp job-configs.tgz s3://$dromedary_s3_bucket/$config_tar_path
popd > /dev/null
rm -rf $temp_dir

if ! aws s3 ls s3://$dromedary_s3_bucket/$config_tar_path; then
    echo "Fatal: Unable to upload Jenkins job configs to s3://$dromedary_s3_bucket/$config_tar_path" >&2
    exit 1
fi

aws cloudformation update-stack \
    --stack-name $pipeline_store_stackname \
    --use-previous-template \
    --capabilities="CAPABILITY_IAM" \
    --parameters ParameterKey=UUID,ParameterValue=$uuid \
        ParameterKey=DromedaryS3Bucket,ParameterValue=$dromedary_s3_bucket \
        ParameterKey=Branch,ParameterValue=$dromedary_branch \
        ParameterKey=MasterStackName,ParameterValue=$MasterStackName \
        ParameterKey=JobConfigsTarball,ParameterValue=$config_tar_path \
        ParameterKey=Hostname,ParameterValue=$dromedary_hostname \
        ParameterKey=Domain,ParameterValue=$my_domainname \
        ParameterKey=MyBuildProvider,ParameterValue=$jenkins_custom_action_provider_name \
        ParameterKey=ProdHostedZone,ParameterValue=$prod_dns_param \
        ParameterKey=VPCStackName,ParameterValue=$VPCStackName \
        ParameterKey=IAMStackName,ParameterValue=$IAMStackName \
        ParameterKey=DDBStackName,ParameterValue=$DDBStackName \
        ParameterKey=ENIStackName,ParameterValue=$dromedary_eni_stack_name \
        ParameterKey=DromedaryAppURL,ParameterValue=$prod_dns_param \
        ParameterKey=KeyName,ParameterValue=$dromedary_ec2_key
 
sleep 60

