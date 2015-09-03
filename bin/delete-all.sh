#!/bin/bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

echo 'This will delete all dromedary resources.'
read -p '<ENTER> to continue ...'

$script_dir/codepipeline-delete.sh || exit $?
$script_dir/cfn-delete-all.sh || exit $?

rm -f "$ENVIRONMENT_FILE"
