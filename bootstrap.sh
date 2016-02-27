#!/bin/bash -x
set -o pipefail

EC2_KEY_PAIR_NAME=xxxx
HOSTED_ZONE_NAME=xxx.com
DYNAMODB_TABLE_NAME=xxxxx
GITHUB_TOKEN=xxxx
GITHUB_USER=xxxx
AWS_REGION=xxxx
DEV_BUCKET=xxxx
BASE_TEMPLATE_URL=https://s3.amazonaws.com/${DEV_BUCKET}/
ENABLE_CONFIG=false
DROMEDARY_BUCKET=xxxx #for example in goldbase it would be:  dromedary-592804526322
STACK_NAME=DromedaryStack

aws s3api create-bucket --bucket ${DEV_BUCKET}

for json in $(ls pipeline/cfn/*.json);
do
  aws s3 cp ${json} s3://${DEV_BUCKET}/
done

which jq
if [[ $? != 0 ]];
then
  echo "jq must be installed - on a mac: brew install jq"
  exit 1
fi

aws ec2 describe-key-pairs --key-names ${EC2_KEY_PAIR_NAME} --region ${AWS_REGION} | jq '.KeyPairs|length'
if [[ $? != 0 ]];
then
  set -e
  aws ec2 create-key-pair --key-name ${EC2_KEY_PAIR_NAME} \
                          --region ${AWS_REGION} \
                          | jq '.KeyMaterial' \
                          | ruby -e 'puts STDIN.read.gsub(/"/,"").gsub(/\\n/,"\n")' > ${EC2_KEY_PAIR_NAME}.pem
fi

hosted_zone_count=$(aws route53 list-hosted-zones-by-name --dns-name ${HOSTED_ZONE_NAME} | jq '.HostedZones|length')
if [[ ${hosted_zone_count} == 0 ]];
then
  set -e
  aws route53 create-hosted-zone --name ${HOSTED_ZONE_NAME} \
                                 --caller-reference $(date +'%m-%d-%Y') \
                                 --hosted-zone-config Comment="for dromedary hacking"
fi

pushd test-security-integration/lambda
zip -r config-rules.zip *
aws s3 cp config-rules.zip s3://${DROMEDARY_BUCKET}/lambda/ --profile ${AWS_PROFILE}
rm config-rules.zip
popd

#update the lambdas if ENABLE_CONFIG=false
if [[ "$ENABLE_CONFIG" = "false" ]]; then
    echo "Update the lambdas with the new code:"
    for func in `aws lambda list-functions | jq -c '.Functions[] | select(.FunctionName | startswith("'"${STACK_NAME:0:25}"'"))? | {FunctionName} | .FunctionName'`
    do
        echo "aws lambda update-function-code --function-name ${func} --s3-bucket ${DROMEDARY_BUCKET} --s3-key lambda/config-rules.zip --publish" | sh
    done
fi

aws cloudformation create-stack \
--stack-name ${STACK_NAME}  \
--template-body file://pipeline/cfn/dromedary-master.json \
--region ${AWS_REGION} \
--disable-rollback --capabilities="CAPABILITY_IAM" \
--parameters ParameterKey=KeyName,ParameterValue=${EC2_KEY_PAIR_NAME} \
	ParameterKey=Branch,ParameterValue=master \
	ParameterKey=BaseTemplateURL,ParameterValue=${BASE_TEMPLATE_URL} \
	ParameterKey=GitHubUser,ParameterValue=${GITHUB_USER} \
	ParameterKey=GitHubToken,ParameterValue=${GITHUB_TOKEN} \
	ParameterKey=DDBTableName,ParameterValue=${DYNAMODB_TABLE_NAME} \
	ParameterKey=ProdHostedZone,ParameterValue=.${HOSTED_ZONE_NAME} \
	ParameterKey=pEnableConfig,ParameterValue=.${ENABLE_CONFIG} \
	ParameterKey=Domain,ParameterValue=${HOSTED_ZONE_NAME}.
