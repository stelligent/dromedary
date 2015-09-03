#!/bin/bash

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

# NUKE PIPELINE
aws codepipeline delete-pipeline --name $dromedary_codepipeline
aws codepipeline delete-custom-action-type \
    --action-version 1 --category Build --provider $dromedary_custom_action_provider
aws codepipeline delete-custom-action-type \
    --action-version 1 --category Test --provider $dromedary_custom_action_provider
