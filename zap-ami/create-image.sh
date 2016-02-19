#!/bin/bash -e

required_env_vars=(AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY)
for required_env_var in "${required_env_vars[@]}";
do
  if [[ -z ${!required_env_var} ]];
  then
    echo must set ${required_env_var}
    exit 1
  fi
done

packer validate ./zap-ami-packer.json

#export PACKER_LOG=1
packer build -var aws_access_key=${AWS_ACCESS_KEY_ID} \
             -var aws_secret_key=${AWS_SECRET_ACCESS_KEY} \
             ./zap-ami-packer.json
