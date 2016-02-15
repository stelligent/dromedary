#!/bin/bash
. /etc/profile
set -ex

. ./environment.sh

gem install rspec aws-sdk
pushd test-security-integration
rspec
popd
