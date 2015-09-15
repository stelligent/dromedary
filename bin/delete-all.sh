#!/bin/bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

echo 'This will delete all dromedary resources.'
echo
echo "Dump of environment.sh:"
cat $ENVIRONMENT_FILE
echo
read -p '<ENTER> to continue ...'

echo deleting Route 53 record sets...
$script_dir/route53-delete-recordset.sh
echo deleting application stacks...
$script_dir/cfn-delete-all-appstacks.sh
echo deleting codepipeline pipeline...
$script_dir/codepipeline-delete.sh
echo deleting infrastructure stacks...
$script_dir/cfn-delete-stacks.sh

rm -f "$ENVIRONMENT_FILE"
