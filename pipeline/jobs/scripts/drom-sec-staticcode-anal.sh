#!/bin/bash
. /etc/profile
set -e

ruby -v

gem install cfn-nag --version 0.0.6 \
                    --conservative

set +e
templates_to_audit=pipeline/cfn/dromedary-master.json
#templates_to_audit=$(ls pipeline/cfn/*.json)

for cfn_json in ${templates_to_audit};
do
  echo "Linting: ${cfn_json}"

  cfn_nag --input-json ${cfn_json} \
          --output-format json
  result=$?
  if [[ ${result} != 0 ]];
  then
    failed=true
  fi
done

if [[ ${failed} == true ]];
then
  exit 1
else
  exit 0
fi