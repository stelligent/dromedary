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
aws codepipeline create-custom-action-type --cli-input-json "$(generate_cli_json Test)"

pipelinejson=$(mktemp /tmp/dromedary-pipeline.json.XXXX)
pipelinedeployjson=$(mktemp /tmp/dromedary-pipeline-deploy.json.XXXX)
pipeline_name="Dromedary$(echo $dromedary_hostname | tr '[[:lower:]]' '[[:upper:]]')"

cp "$script_dir/../pipeline/cfn/codepipeline-cfn.json" $pipelinejson
cp "$script_dir/../pipeline/cfn/codepipeline-codedeploy.json" $pipelinedeployjson

sed s/DromedaryJenkins/$dromedary_custom_action_provider/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s/DromedaryPipelineName/$pipeline_name/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s,arn:aws:iam::123456789012:role/AWS-CodePipeline-Service,$codepipeline_role_arn,g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson
sed s/codepipeline-us-east-1-XXXXXXXXXXX/$dromedary_s3_bucket/g $pipelinejson > $pipelinejson.new && mv $pipelinejson.new $pipelinejson

sed s/DromedaryJenkins/$dromedary_custom_action_provider/g $pipelinedeployjson > $pipelinedeployjson.new && mv $pipelinedeployjson.new $pipelinedeployjson
sed s/DromedaryPipelineName/$pipeline_name/g $pipelinedeployjson > $pipelinedeployjson.new && mv $pipelinedeployjson.new $pipelinedeployjson
sed s,arn:aws:iam::123456789012:role/AWS-CodePipeline-Service,$codepipeline_role_arn,g $pipelinedeployjson > $pipelinedeployjson.new && mv $pipelinedeployjson.new $pipelinedeployjson
sed s/codepipeline-us-east-1-XXXXXXXXXXX/$dromedary_s3_bucket/g $pipelinedeployjson > $pipelinedeployjson.new && mv $pipelinedeployjson.new $pipelinedeployjson

mygithubtoken=$1
mygithubuser=$2
mybranch=$3

echo The value of variable mygithubtoken = $mygithubtoken 
echo The value of variable mygithubuser = $mygithubuser 
echo The value of variable mybranch = $mybranch
echo The value of variable dromedary_pipeline_stack_name = $dromedary_pipeline_stack_name 
echo The value of variable dromedary_pipeline_codedeploy_stack_name = $dromedary_pipeline_codedeploy_stack_name 
echo The value of variable dromedary_codedeploy_config_name = $dromedary_codedeploy_config_name 
echo The value of variable dromedary_codedeploy_app_name = $dromedary_codedeploy_app_name 

aws cloudformation create-stack --stack-name $dromedary_pipeline_stack_name --template-body file://$pipelinejson --region us-east-1 --disable-rollback --capabilities="CAPABILITY_IAM" --parameters ParameterKey=GitHubToken,ParameterValue=$mygithubtoken ParameterKey=GitHubUser,ParameterValue=$mygithubuser ParameterKey=Branch,ParameterValue=$mybranch ParameterKey=MyJenkinsURL,ParameterValue=$jenkins_url ParameterKey=MyBuildProvider,ParameterValue=$dromedary_custom_action_provider 
aws cloudformation create-stack --stack-name $dromedary_pipeline_codedeploy_stack_name --template-body file://$pipelinedeployjson --region us-east-1 --disable-rollback --capabilities="CAPABILITY_IAM" --parameters ParameterKey=GitHubToken,ParameterValue=$mygithubtoken ParameterKey=GitHubUser,ParameterValue=$mygithubuser ParameterKey=Branch,ParameterValue=$mybranch ParameterKey=MyDeploymentConfigName,ParameterValue=$dromedary_codedeploy_config_name ParameterKey=MyApplicationName,ParameterValue=$dromedary_codedeploy_app_name

echo "export dromedary_codepipeline=$dromedary_pipeline_stack_name" >> "$ENVIRONMENT_FILE"
echo "export dromedary_codepipeline_codedeploy=$dromedary_pipeline_codedeploy_stack_name" >> "$ENVIRONMENT_FILE"
rm -f $pipelinejson
rm -f $pipelinedeployjson

