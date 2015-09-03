#!/bin/bash -ex
npm install
gulp dist
artifact_path="dromedary-$(date +%Y%m%d-%H%M%S).tar.gz"
aws s3 cp dist/archive.tar.gz s3://$DROMEDARY_S3_BUCKET/$artifact_path

echo "export dromedary_artifact_path=$artifact_path" > environment.sh
