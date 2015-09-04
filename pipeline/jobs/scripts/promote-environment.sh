#!/bin/bash
set -ex

. environment.sh

bash "$(dirname $0)/../../../bin/route53-update-prod-dns.sh" $dromedary_accepted_ip
