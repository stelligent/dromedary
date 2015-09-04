#!/bin/bash -e

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

existing_records="$(aws route53 list-resource-record-sets --hosted-zone-id $route53_zone_id --output=json --query "ResourceRecordSets[?Name==\`${hostname}.${domainname}.\`].ResourceRecords")"
if [ -n "$existing_records" ]; then
    echo "Fatal: ${hostname}.${domainname} already exists in zone $route53_zone_id" >&2
    exit 1
fi

echo "export dromedary_hostname=$hostname" >> "$ENVIRONMENT_FILE"
echo "export dromedary_domainname=$domainname" >> "$ENVIRONMENT_FILE"
echo "export dromedary_zone_id=$route53_zone_id" >> "$ENVIRONMENT_FILE"

set -ex
"$script_dir/cfn-bootstrap.sh" "$hostname"
"$script_dir/cfn-create-jenkins.sh"
"$script_dir/codepipeline-create.sh"
