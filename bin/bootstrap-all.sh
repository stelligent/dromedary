#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE ... remove if you need to bootstrap!" 2>&1
    exit 1
fi

prod_dns="$(echo $1 | sed 's/[.]$//')"
if [ -z "$prod_dns" ]; then
    echo "Usage: $(basename $0) hostname.domain" >&2
    exit 1
fi

hostname=$(echo $prod_dns | cut -f 1 -d . -s)
domainname=$(echo $prod_dns | sed s/^$hostname[.]//)

if [ -z "$hostname" -o -z "$domainname" ]; then
    echo "Fatal: $prod_dns is an invalid hostname" >&2
    exit 1
fi

route53_zone_id=$(aws route53 list-hosted-zones --output=text --query "HostedZones[?Name==\`${domainname}.\`].Id" | sed 's,^/hostedzone/,,')
if [ -z "$route53_zone_id" ]; then
    echo "Fatal: unable to find Route53 zone id for $domainname." >&2
    exit 1
fi

existing_records="$(aws route53 list-resource-record-sets --hosted-zone-id $route53_zone_id --output=text --query "ResourceRecordSets[?Name==\`${hostname}.${domainname}.\`].ResourceRecords")"
if [ -n "$existing_records" ]; then
    echo "Fatal: ${hostname}.${domainname} already exists in zone $route53_zone_id" >&2
    exit 1
fi

# ensure EC2 key pair exists (if specified)
if [ -n "$DROMEDARY_EC2_KEY" ]; then
    if ! aws ec2 describe-key-pairs --key-names $DROMEDARY_EC2_KEY > /dev/null ; then
        echo "Fatal: \$DROMEDARY_EC2_KEY is set, but $DROMEDARY_EC2_KEY doesn't exist" >&2
        exit 1
    fi
fi

# ensure S3 bucket exists
if [ -z "$AWS_ACCOUNT_ID" ]; then
    aws_account_id="$(curl --connect-timeout 1 --retry 0 -s http://169.254.169.254/latest/meta-data/iam/info | grep -o 'arn:aws:iam::[0-9]\+:' | cut -f 5 -d :)"
    if [ -z "$aws_account_id" ]; then
        aws_account_id="$(aws iam get-user --output=text --query 'User.Arn' | cut -f 5 -d :)"
    fi
    if [ -z "$aws_account_id" ]; then
        echo "Fatal: unable to determine AWS Account Id!" >&2
        echo "Your environment may not configured properly" >&2
        exit 1
    fi
    export AWS_ACCOUNT_ID="$aws_account_id"
fi
s3_bucket="dromedary-$AWS_ACCOUNT_ID"
aws s3 mb s3://$s3_bucket || exit $?

echo "export dromedary_hostname=$hostname" >> "$ENVIRONMENT_FILE"
echo "export dromedary_domainname=$domainname" >> "$ENVIRONMENT_FILE"
echo "export dromedary_zone_id=$route53_zone_id" >> "$ENVIRONMENT_FILE"
echo "export dromedary_s3_bucket=$s3_bucket" >> "$ENVIRONMENT_FILE"

set -ex
"$script_dir/cfn-bootstrap.sh" "$hostname"
"$script_dir/cfn-create-jenkins.sh"
"$script_dir/cfn-create-eni.sh"
"$script_dir/codepipeline-create.sh"
