#!/bin/bash -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

echo 'This will delete all dromedary resources.'
read -p '<ENTER> to continue ...'

$script_dir/route53-delete-recordset.sh
$script_dir/cfn-delete-all-appstacks.sh
$script_dir/codepipeline-delete.sh
$script_dir/cfn-delete-stacks.sh

rm -f "$ENVIRONMENT_FILE"
