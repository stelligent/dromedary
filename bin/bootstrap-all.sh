#!/bin/bash -ex

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE ... remove if you need to bootstrap!" 2>&1
    exit 1
fi

"$script_dir/cfn-bootstrap.sh" "$@"
"$script_dir/cfn-create-jenkins.sh"
"$script_dir/codepipeline-create.sh"
