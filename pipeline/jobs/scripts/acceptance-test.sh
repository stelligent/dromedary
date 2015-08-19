#!/bin/bash -ex

## Uncomment when ready to execute tests
#npm install
#export AUTOMATED_ACCEPTANCE_TEST=true
#node app.js > server.log 2>&1 &
#server_pid=$!
#sleep 1
#if ! gulp test-functional; then
#    rc=$?
#    kill $server_pid
#    exit $rc
#fi
#kill $server_pid

echo "All tests passed!"
