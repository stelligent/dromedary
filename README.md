# dromedary :dromedary_camel:
Sample app to demonstrate a working pipeline using [AWS Code Services](https://aws.amazon.com/awscode/)

## Infrastructure as Code

Dromedary was featured by [Paul Duvall](https://twitter.com/PaulDuvall),
[Stelligent](http://www.stelligent.com/)'s Chief Technology Officer, during the
ARC307: Infrastructure as Code breakout session at 2015
[AWS re:Invent](https://reinvent.awsevents.com/).

You can view the recording of that breakout session at
[https://www.youtube.com/watch?v=WL2xSMVXy5w](https://www.youtube.com/watch?v=WL2xSMVXy5w).

## The Demo App :dromedary_camel:

The Dromedary demo app is a simple nodejs application that displays a pie chart to users. The data that
describes the pie chart (eg: the colors and their values) is served by the application.

If a user clicks on a particular color segment in the chart, the frontend will send a request to the
backend to increment the value for that color and update the chart with the new value.

The frontend will also poll the backend for changes to values of the colors of the pie chart and update the chart
appropriately. If it detects that a new version of the app has been deployed, it will reload the page.

Directions are provided to run this demo in AWS and locally. 

### Running in AWS :dromedary_camel:

**DISCLAIMER**: Executing the following will create billable AWS resources in your account. Be sure to clean
up Dromedary resources after you are done to minimize charges

**PLEASE NOTE**: This demo is an exercise in _Infrastructure as Code_, and is meant to demonstrate neither
best practices in highly available nor highly secure deployments in AWS.
details that go against best practices!

#### Manual Bootstrapping

You'll need the AWS CLI tools [installed](https://aws.amazon.com/cli/) and [configured](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to start.

You'll also need to create a hosted zone in [Route53](https://aws.amazon.com/route53/). This hosted zone does
not necessarily need to be publicly available and a registered domain.

After cloning the repo, run the bootstrap script to create the environment in which Dromedary will be
deployed:

```
./bin/bootstrap-all.sh PRODHOST.HOSTED.ZONE
```

The bootstrap script requires a hostname to be passed as argument. This hostname represents the "production"
host which will be updated at the last step of the pipeline.

#### CloudFormation Bootstrapping (e.g. for AWS Test Drive)

You can either use the aws-cli or the web console to launch a new cloudformation stack. This example shows how to use the CLI.

```
aws cloudformation create-stack \
	--stack-name Dromedary-bootstrap \
	--template-body https://raw.githubusercontent.com/stelligent/dromedary/master/pipeline/cfn/testdrive.json \
	--capabilities CAPABILITY_IAM \
	--parameters ParameterKey=DromedaryRepo,ParameterValue=https://github.com/stelligent/dromedary.git \
		ParameterKey=AliveDuration,ParameterValue=4h \
		ParameterKey=Branch,ParameterValue=master \
		ParameterKey=Ec2SshKeyName,ParameterValue=YOUR.KEYPAIR
		ParameterKey=ProdHostedZone,ParameterValue=PRODHOST.HOSTED.ZONE
```

In the above example, you'll need to set the PRODHOST.HOSTED.ZONE value to your Route53 hosted zone.

Parameters | Description
---------- | ------------
DromedaryRepo  | The Github https address to the public dromedary repository.
Branch | The name of the Github branch.
AliveDuration | Duration to keep demo deployment active. (e.g. 4h, 3h, 30m, etc)
ProdHostedZone | Route53 Hosted Zone (e.g. PRODHOST.HOSTED.ZONE)
Ec2SshKeyPair | The ec2 key name to use for ssh access to the bootstrapping instance.

**AliveDuration:** The CloudFormation stack and all of the resources related to Dromedary will self-terminate after this duration. **IMPORTANT**: You will need to manually delete the CloudFormation stack after self-termination.

**Bootstrapping Tests**
View the outputs in CloudFormation for links to test reports uploaded to your Dromedary S3 bucket.

#### Post-bootstrap steps

After the bootstrap script completes, you'll need to make one manual update to the CodePipeline it created:

1. Go to the [CodePipeline console](https://console.aws.amazon.com/codepipeline/home?region=us-east-1#/dashboard)
1. Click on the new pipeline just created - it should be named `DromedaryPRODHOST`
1. Click the `Edit` button
1. Edit the `Source` step that is initialized as `Amazon S3`
1. Change the Source Provider to `Github`
1. Click the `Connect to Github` button
1. Enter:
        1. `stelligent/dromedary` in the Repository text box (or, if you fork it: `USERNAME/dromedary`)
        1. `master` in the Branch text box
        1. `DromedarySource` in the Output artifact #1 text box
1. Click the `Update` button
1. Click the `Save pipeline changes` button

Shortly after you confirm the pipeline changes, CodePipeline will kick off an execution of the pipeline.

Upon completion of a successful pipeline execution, Dromedary will be available at the hostname you specified
to the bootstrap script. If that hosted zone is not a publicly registered domain, you access Dromedary via IP
address. The ip address can be queried by viewing the EIP output of the eni CloudFormation stack.

Every time changes are pushed to Github, CodePipeline will test and deploy those changes.

#### Manual Cleanup
For manually bootstrapped builds, to delete (nearly) all Dromedary resources, execute the delete script:

```
./bin/delete-all.sh
```

The only resources that remain and require manual deletion is the Dromedary S3 bucket.

Builds made using the AWS Test Drive CloudFormation stack will self terminate all resources after the AliveDuration timeout. You will need to manually delete the CloudFormation stack.

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
