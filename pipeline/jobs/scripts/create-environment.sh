#!/bin/bash
set -ex

bash "$(dirname $0)/../../../bin/cfn-create-app.sh"
