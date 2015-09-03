#!/bin/bash -ex

. environment.sh

npm install
gulp dist
artifact_path="dromedary-$(date +%Y%m%d-%H%M%S).tar.gz"
aws s3 cp dist/archive.tar.gz s3://$dromedary_s3_bucket/$artifact_path

echo "export dromedary_artifact_path=$artifact_path" >> environment.sh
