# dromedary :dromedary_camel:
Sample app to demonstrate a working pipeline using [AWS Code Services](https://aws.amazon.com/awscode/)

## The Demo App :dromedary_camel:

The Dromedary demo app is a simple nodejs application that displays a pie chart to users. The data that
describes the pie chart (eg: the colors and their values) is served by the application.

If a user clicks on a particular color segment in the chart, the frontend will send a request to the
backend to increment the value for that color and update the chart with the new value.

The frontend will also poll the backend for changes to values of the colors of the pie chart and update the chart
appropriately. If it detects that a new version of the app has been deployed, it will reload the page.

Directions are provided to run this demo in AWS and locally. 

### Running in AWS :dromedary_camel:

You'll need the AWS CLI tools [installed](https://aws.amazon.com/cli/) and [configured](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to start.

Then, run the CloudFormation template to set up the required resources:

export STACKNAME="dromedary-`date +%Y%m%d%H%M%S`"

    aws cloudformation create-stack \
      --stack-name $STACKNAME  \
      --template-body file://pipeline/cfn/infrastructure.json \
      --capabilities CAPABILITY_IAM

Once that stack is complete, you'll need to run these commands to create the [CodeDeploy](https://aws.amazon.com/codedeploy/) resources:

    # get the service role from the stack resources
    export SVCROLE=`aws cloudformation describe-stacks --stack-name $STACKNAME --output text --query Stacks[*].Outputs[?OutputKey==\'CodeDeployServiceRoleARN\'].OutputValue`

    # create cloud patrol app in code deploy
    aws deploy create-application \
      --application-name dromedary

    # create a deployment group, you'll need to look up the ARN from the first CFN template
    aws deploy create-deployment-group \
      --application-name dromedary \
      --deployment-group-name dromedary-beta \
      --deployment-config-name CodeDeployDefault.OneAtATime \
      --ec2-tag-filters Key=environment,Value=dromedary,Type=KEY_AND_VALUE \
      --service-role-arn "$SVCROLE"

To push a deployment of the Dromedary application, run this command:

    zip -qr ../dromedary.zip * && \
    aws s3 cp ../dromedary.zip s3://jps-codepipeline-test && \
    aws deploy create-deployment --application-name dromedary \
        --deployment-group-name dromedary-beta \
        --description "Deploy application to instances" \
        --s3-location bundleType=zip,bucket=jps-codepipeline-test,key=dromedary.zip

 
### Running Locally :dromedary_camel:

#### Install Prerequisites 

1. Ensure [nodejs](https://nodejs.org/) and [npm](https://www.npmjs.com/) are installed
  * On Mac OS X, this can be done via [Homebrew](http://brew.sh/): `brew install node`
  * On Amazon Linux, packages are available via the [EPEL](https://fedoraproject.org/wiki/EPEL) yum repo: `yum install -y nodejs npm --enablerepo=epel`
1. Install dependencies: `npm install`

NOTE: Dromedary relies on [gulp](http://gulpjs.com/) for local development and build tasks.
You may need to install gulp globally: `npm install -g gulp`

If gulp is not globally installed, ensure `./node_modules/.bin/` is in your PATH.

#### Local Server

The `serve` task will start a node server listening on port 8080:

1. Run `gulp serve`
1. Point your webbrowser to [http://localhost:8080](http://localhost:8080)

#### Executing Unit Tests

Unit tests located in `test/` were written using [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/),
and can be executed using the `test` task:

1. Run `gulp test`

#### Executing Acceptance Tests

Acceptance tests located in `tests-functional/` require Dromedary to be running (eg: `gulp serve`), and can be
executed using the `test-functional` task:

1. Run `gulp test-functional`

These tests (which, at this time are closer to integration tests than functional tests) exercise the API
endpoints defined in `app.js`.

#### Building a Distributable Archive

The `dist` task copies relevent files to `dist/` and installs only dependencies required to run the standalone
app:

1. Run `gulp dist`

`dist/archive.tar.gz` will be created if this task run successfully.
