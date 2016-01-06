#!/usr/bin/env bash
set -e

script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. "$ENVIRONMENT_FILE"

echo In the codepipeline-delete.sh script
echo The value of variable dromedary_codepipeline = $dromedary_codepipeline 
echo The value of variable dromedary_codepipeline_codedeploy = $dromedary_codepipeline_codedeploy 


# NUKE PIPELINES
aws codepipeline delete-pipeline --name $dromedary_codepipeline
aws codepipeline delete-pipeline --name $dromedary_codepipeline_codedeploy

aws codepipeline delete-custom-action-type \
    --action-version 1 --category Build --provider $dromedary_custom_action_provider
aws codepipeline delete-custom-action-type \
    --action-version 1 --category Test --provider $dromedary_custom_action_provider
