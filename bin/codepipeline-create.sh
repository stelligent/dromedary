#!/usr/bin/env bash
set -e

echo The value of arg 0 = $0
echo The value of arg 1 = $1
echo The value of arg 2 = $2 
echo The value of arg 3 = $3


script_dir="$(dirname "$0")"
ENVIRONMENT_FILE="$script_dir/../environment.sh"
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "Fatal: environment file $ENVIRONMENT_FILE does not exist!" 2>&1
    exit 1
fi

. $ENVIRONMENT_FILE

echo The value of ENVIRONMENT_FILE = $ENVIRONMENT_FILE

jenkins_ip="$(aws cloudformation describe-stacks --stack-name $dromedary_jenkins_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`PublicDns`].OutputValue')"
codepipeline_role_arn="$(aws cloudformation describe-stacks --stack-name $dromedary_iam_stack_name --output text --query 'Stacks[0].Outputs[?OutputKey==`CodePipelineTrustRoleARN`].OutputValue')"
jenkins_url="http://$jenkins_ip:8080"

generate_cli_json() {
    cat << _END_
{
    "category": "$1",
    "provider": "$dromedary_custom_action_provider",
    "version": "1",
    "settings": {
        "entityUrlTemplate": "$jenkins_url/job/{Config:ProjectName}",
        "executionUrlTemplate": "$jenkins_url/job/{Config:ProjectName}/{ExternalExecutionId}"
    },
    "configurationProperties": [
        {
            "name": "ProjectName",
            "required": true,
            "key": true,
            "secret": false,
            "queryable": true
        }
    ],
    "inputArtifactDetails": {
        "minimumCount": 0,
        "maximumCount": 5
    },
    "outputArtifactDetails": {
        "minimumCount": 0,
        "maximumCount": 5
    }
}
_END_
}

# aws codepipeline create-custom-action-type --cli-input-json "$(generate_cli_json Build)"
# aws codepipeline create-custom-action-type --cli-input-json "$(generate_cli_json Test)"

pipelinejson=$(mktemp /tmp/dromedary-pipeline.json.XXXX)
pipeline_name="Dromedary$(echo $dromedary_hostname | tr '[[:lower:]]' '[[:upper:]]')"

cp "$script_dir/../pipeline/cfn/codepipeline-cfn.json" $pipelinejson

sed s/DromedaryJenkins/$dromedary_custom_action_provider/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s/DromedaryPipelineName/$pipeline_name/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s,arn:aws:iam::123456789012:role/AWS-CodePipeline-Service,$codepipeline_role_arn,g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s/codepipeline-us-east-1-XXXXXXXXXXX/$dromedary_s3_bucket/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson

mygithubtoken=$1
mygithubuser=$2
mybranch=$3


echo The value of variable mygithubtoken = $mygithubtoken 
echo The value of variable mygithubuser = $mygithubuser 
echo The value of variable mybranch = $mybranch
echo The value of variable dromedary_pipeline_stack_name = $dromedary_pipeline_stack_name 
echo The value of variable dromedary_custom_action_provider = $dromedary_custom_action_provider
echo The value of variable dromedary_jenkins_stack_name = $dromedary_jenkins_stack_name
echo The value of variable dromedary_iam_stack_name = $dromedary_iam_stack_name
echo The value of variable pipeline_name = $pipeline_name
echo The value of variable codepipeline_role_arn = $codepipeline_role_arn
echo The value of variable dromedary_s3_bucket = $dromedary_s3_bucket

# Create Custom Actions
aws cloudformation create-stack \
    --stack-name $dromedary_pipeline_customactions_stack_name \
    --capabilities CAPABILITY_IAM \
    --template-body file://./pipeline/cfn/codepipeline-custom-actions.json \
    --parameters ParameterKey=MyBuildProvider,ParameterValue=$dromedary_custom_action_provider ParameterKey=MyJenkinsURL,ParameterValue=$jenkins_url  

customactions_stack_status="$(bash $script_dir/cfn-wait-for-stack.sh $dromedary_pipeline_customactions_stack_name)"
customactions_stack_wait=$?

echo

if [ $customactions_stack_wait -ne 0 ]; then
    echo "Fatal: Custom Actions stack $dromedary_pipeline_customactions_stack_name ($customactions_stack_status) failed to create properly" >&2
    exit 1
fi

aws cloudformation create-stack --stack-name $dromedary_pipeline_stack_name --template-body file://$pipelinejson --region us-east-1 --disable-rollback --capabilities="CAPABILITY_IAM" --parameters ParameterKey=GitHubToken,ParameterValue=$mygithubtoken ParameterKey=GitHubUser,ParameterValue=$mygithubuser ParameterKey=Branch,ParameterValue=$mybranch ParameterKey=MyJenkinsURL,ParameterValue=$jenkins_url ParameterKey=MyBuildProvider,ParameterValue=$dromedary_custom_action_provider 

echo "export dromedary_codepipeline=$dromedary_pipeline_stack_name" >> "$ENVIRONMENT_FILE"
rm -f $pipelinejson
