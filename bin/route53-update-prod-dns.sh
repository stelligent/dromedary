#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

ip_addr=$1
if [ -z "$ip_addr" ]; then
    echo "Usage: $(basename $0) <ip-address>" >&2
    exit 1
fi

change_batch=$(mktemp /tmp/dromedary-route53.json.XXXX)

cat > $change_batch << _END_
{
    "Comment": "Update dromedary dns to $ip_addr",
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "${dromedary_hostname}.${dromedary_domainname}.",
            "Type": "A",
            "TTL": 60,
            "ResourceRecords": [{ "Value": "$ip_addr" }]
        }
    }]
}
_END_

change_id=$(aws route53 change-resource-record-sets --hosted-zone-id $dromedary_zone_id \
    --change-batch file://$change_batch --output=text --query 'ChangeInfo.Id' | sed 's,^/change/,,')

if [ -z "$change_id" ]; then
    echo "Fatal: change-resource-record-sets failed" >&2
    exit 1
fi

while [ "$(aws route53 get-change --id $change_id --output=text --query ChangeInfo.Status)" != 'INSYNC' ]; do
    sleep 1
done

rm -f $change_batch
