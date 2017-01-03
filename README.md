# dromedary :dromedary_camel: <img align="right" src="liatrio.png">
Dromedary is a sample application used by Liatrio to demonstrate CI/CD methods.

### The Demo App  

The Dromedary demo app is a simple nodejs application that displays a pie chart to users. The data that
describes the pie chart (i.e. the colors and their values) is served by the application.

If a user clicks on a particular color segment in the chart, the frontend will send a request to the
backend to increment the value for that color and update the chart with the new value.

The frontend will also poll the backend for changes to values of the colors of the pie chart and update the chart
appropriately. If it detects that a new version of the app has been deployed, it will reload the page.

### Running Locally :dromedary_camel:

#### Install Prerequisites 

1. Ensure [nodejs](https://nodejs.org/) and [npm](https://www.npmjs.com/) are installed
  * On Mac OS X, this can be done via [Homebrew](http://brew.sh/): `brew install node`
  * On Amazon Linux, packages are available via the [EPEL](https://fedoraproject.org/wiki/EPEL) yum repo: `yum install -y nodejs npm --enablerepo=epel`
1. Java must be installed so that [DynamoDB Local](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tools.DynamoDBLocal.html) can run
1. Install dependencies: `npm install`

NOTE: Dromedary relies on [gulp](http://gulpjs.com/) for local development and build tasks.
You may need to install gulp globally: `npm install -g gulp`

If gulp is not globally installed, ensure `./node_modules/.bin/` is in your PATH.

#### Local Server

The default task will start dynamodb-local on port 8079 and a node server listening on port 8080:

1. Run `gulp` - this downloads and starts DynamoDB Local and starts Node
1. Point your webbrowser to [http://localhost:8080](http://localhost:8080)

#### Executing Unit Tests

Unit tests located in `test/` were written using [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/),
and can be executed using the `test` task:

1. Run `gulp test`

#### Executing Acceptance Tests

Acceptance tests located in `tests-functional/` require Dromedary to be running (eg: `gulp`), and can be
executed using the `test-functional` task:

1. Run `gulp test-functional`

These tests (which, at this time are closer to integration tests than functional tests) exercise the API
endpoints defined in `app.js`.

#### Building a Distributable Archive

The `dist` task copies relevant files to `dist/` and installs only dependencies required to run the standalone
app:

1. Run `gulp dist`

`dist/archive.tar.gz` will be created if this task run successfully.  
  
### Infrastructure as Code

Dromedary was featured by [Paul Duvall](https://twitter.com/PaulDuvall),
[Stelligent](http://www.stelligent.com/)'s Chief Technology Officer, during the
ARC307: Infrastructure as Code breakout session at 2015
[AWS re:Invent](https://reinvent.awsevents.com/).

Click [here](https://www.youtube.com/watch?v=WL2xSMVXy5w) to view a recording of the re:Invent breakout session or, to view a shorter 10-minute walkthrough of the demo, click [here](https://stelligent.com/2015/11/17/stelligent-aws-continuous-delivery-demo-screencast/).
