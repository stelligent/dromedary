# dromedary :dromedary_camel:
Sample app to demonstrate a working pipeline using AWS Code Services


## Install Prerequisites

1. Ensure nodejs is installed
1. Install dependencies: `npm install`
  * You may need to install gulp globally: `npm install -g gulp`
  * If gulp is not globally installed, ensure `./node_modules/.bin/` is in your PATH.

## Running Locally

1. Run `gulp serve`
1. Point your webbrowser to [http://localhost:8080](http://localhost:8080)

## Executing Unit Tests

1. Run `gulp test`

## Deploying

1. Run `gulp dist`
1. Deliver `dist/archive.tar.gz` to server that has nodejs installed
1. On server, run `node app.js` in directory where tarball was extracted
