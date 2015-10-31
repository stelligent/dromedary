#!/bin/bash
. /etc/profile
set -ex

. environment.sh

bash "$(dirname $0)/../../../bin/eni-attach-to-app.sh" $dromedary_app_stack_name
