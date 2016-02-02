#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"

echo In test-jenkins-create.sh

echo The value of arg 0 = $0
echo The value of arg 1 = $1 
echo The value of arg 2 = $2 
echo The value of arg 3 = $3 

my_branch_name=$1
my_stack_name=$2
my_aws_account_id=$3
my_hostname="$my_stack_name"
my_domainname="oneclickdeployment.com"
my_vpc_stack_name="vpcstacknamecommandarg"
my_iam_stack_name="iamstacknamecommandarg"
my_ddb_stack_name="ddbstacknamecommandarg"
my_eni_stack_name="enistacknamecommandarg"

#Use Hamburger Store?

#jenkins_custom_action_provider_name="Jenkins$my_stack_name56a2fe27"
dromedary_jenkins_stack_name="$my_stack_name-jenkins"
dromedary_s3_bucket="dromedary-$my_aws_account_id"
dromedary_branch="$my_branch_name"
dromedary_vpc_stack_name="$my_vpc_stack_name"
dromedary_iam_stack_name="$my_iam_stack_name"
dromedary_ddb_stack_name="$my_ddb_stack_name"
dromedary_eni_stack_name="$my_eni_stack_name"
dromedary_ec2_key=
dromedary_hostname="$my_stack_name"
dromedary_domainname="$my_domainname"

#jenkins_instance_profile="$(aws cloudformation describe-stacks --stack-name $iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfile`].OutputValue')"


dromedary_zone_id=$(aws route53 list-hosted-zones --output=text --query "HostedZones[?Name==\`${dromedary_domainname}.\`].Id" | sed 's,^/hostedzone/,,')
if [ -z "$dromedary_zone_id" ]; then
    echo "Fatal: unable to find Route53 zone id for $dromedary_domainname." >&2
    exit 1
fi

jenkins_custom_action_provider_name="Jenkins$(echo $dromedary_hostname | tr '[[:lower:]]' '[[:upper:]]')$(printf "%x" $(date +%s))"

temp_dir=$(mktemp -d /tmp/dromedary.XXXX)
config_dir="$(dirname $0)/../pipeline/jobs/xml"
config_tar_path="$dromedary_jenkins_stack_name/jenkins-job-configs-$(date +%s).tgz"

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
