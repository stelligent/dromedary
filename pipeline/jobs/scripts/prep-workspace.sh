#!/bin/bash -ex

# since the workspace is maintained throughout the build,
# install dependencies now in a clear workspace
rm -rf node_modules dist
npm install
