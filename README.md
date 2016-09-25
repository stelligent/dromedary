# dromedary :dromedary_camel:
Sample app to demonstrate a working pipeline using [AWS Code Services](https://aws.amazon.com/awscode/)

## Infrastructure as Code

Dromedary was featured by [Paul Duvall](https://twitter.com/PaulDuvall),
[Stelligent](http://www.stelligent.com/)'s Chief Technology Officer, during the
ARC307: Infrastructure as Code breakout session at 2015
[AWS re:Invent](https://reinvent.awsevents.com/).

Click [here](https://www.youtube.com/watch?v=WL2xSMVXy5w) to view a recording of the re:Invent breakout session or, to view a shorter 10-minute walkthrough of the demo, click [here](https://stelligent.com/2015/11/17/stelligent-aws-continuous-delivery-demo-screencast/).

## The Demo App :dromedary_camel:

The Dromedary demo app is a simple nodejs application that displays a pie chart to users. The data that
describes the pie chart (i.e. the colors and their values) is served by the application.

If a user clicks on a particular color segment in the chart, the frontend will send a request to the
backend to increment the value for that color and update the chart with the new value.

The frontend will also poll the backend for changes to values of the colors of the pie chart and update the chart
appropriately. If it detects that a new version of the app has been deployed, it will reload the page.

Directions are provided to run this demo in AWS and locally.

## Core Demo Requirements

Given a version-control repository, the bootstrapping and the application must be capable of launching from a single _CloudFormation_ command and a CloudFormation button click - assuming that an [EC2 Key Pair](http://docs.aws.amazon.com/gettingstarted/latest/wah/getting-started-prereq.html#create-a-key-pair) and [Route 53 Hosted Zone](http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html) has been configured. The demo should not be required to run from a local environment. 

An application pipeline in CodePipeline must go from commit to production in less than 10 minutes.

It should be capable of running on a new AWS account without any additional setup.

## Feature Backlog :dromedary_camel:

We plan to add additional features in the coming months. Check the [issues](https://github.com/stelligent/dromedary/issues) and [Feature Backlog](https://github.com/stelligent/dromedary/wiki/Feature-Backlog) for more information.

### Running in AWS :dromedary_camel:

**DISCLAIMER**: Executing the following will create billable AWS resources in your account. Be sure to clean
up Dromedary resources after you are done to minimize charges

**PLEASE NOTE**: This demo is an exercise in _Infrastructure as Code_, and is meant to demonstrate neither
best practices in highly available nor highly secure deployments in AWS.

#### CloudFormation Bootstrapping (e.g. for AWS Test Drive)

You'll need the AWS CLI tools [installed](https://aws.amazon.com/cli/) and [configured](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to start.

You'll also need to create a hosted zone in [Route53](https://aws.amazon.com/route53/). This hosted zone does
not necessarily need to be publicly available and a registered domain.

You can either use the AWS CLI or the AWS web console to launch a new CloudFormation stack. To launch from the console, click the button below (you'll need to login to your AWS account if you have not already done so).

[![Launch CFN stack](https://s3.amazonaws.com/stelligent-training-public/public/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#cstack=sn~DromedaryStack|turl~https://s3.amazonaws.com/stelligent-training-public/master/dromedary-master.json)

To launch from the CLI, see this example:

```
aws cloudformation create-stack \
--stack-name DromedaryStack  \ 
--template-body https://raw.githubusercontent.com/stelligent/dromedary/master/pipeline/cfn/dromedary-master.json \ 
--region us-east-1 \
--disable-rollback --capabilities="CAPABILITY_IAM" \
--parameters ParameterKey=KeyName,ParameterValue=YOURKEYPAIR \
	ParameterKey=Branch,ParameterValue=master \
	ParameterKey=BaseTemplateURL,ParameterValue=https://s3.amazonaws.com/stelligent-training-public/master/ \
	ParameterKey=GitHubUser,ParameterValue=YOURGITHUBUSER \
	ParameterKey=GitHubToken,ParameterValue=YOURGITHUBTOKEN \ 
	ParameterKey=DDBTableName,ParameterValue=YOURUNIQUEDDBTABLENAME \
	ParameterKey=ProdHostedZone,ParameterValue=.YOURHOSTEDZONE
```

In the above example, you'll need to set the `YOURHOSTEDZONE` value to your Route53 hosted zone. See [Hosted Zones](https://console.aws.amazon.com/route53/home?region=us-east-1#hosted-zones:) for the hosted zones configured in your AWS account.

To integrate with GitHub, AWS CodePipeline uses OAuth tokens. Generate your token at [GitHub](https://github.com/settings/tokens) and ensure you enable the following two scopes:
* `admin:repo_hook`, which is used to detect when you have committed and pushed changes to the repository
* `repo`, which is used to read and pull artifacts from public and private repositories into a pipeline

Parameters | Description
---------- | ------------
KeyName | The EC2 keypair name to use for ssh access to the bootstrapping instance.
GitHubUser | GitHub UserName. This username must be the owner of the Repo.
GitHubToken | Secret. OAuthToken with access to Repo. Go to https://github.com/settings/tokens.
BaseTemplateURL | S3 Base URL of all the CloudFormation templated used in Dromedary (without the file names)
DDBTableName | Unique TableName for the Dromedary DynamoDB database.
ProdHostedZone | Route53 Hosted Zone. You must precede `YOURHOSTEDZONE` with a `.` See [Hosted Zones](https://console.aws.amazon.com/route53/home?region=us-east-1#hosted-zones:) for the hosted zones configured in your AWS account. 

As part of the bootstrapping process, it will automatically launch the Dromedary application stack via CodePipeline. 

#### Outputs

A few of the most relevant CloudFormation outputs from the master stack are listed in the table below.

Output | Description
---------- | ------------
CodePipelineURL | The URL to the instantiated pipeline
JenkinsURL | The URL to Jenkins server that runs the execution of jobs for CodePipeline
DromedaryAppURL | Link to the working application once the application pipeline is complete

#### Post-bootstrap steps

 **IMPORTANT**: You will need to manually delete the CloudFormation stack once you've completed usage. You will be charged for AWS resource usage.

**Bootstrapping Tests**
View the outputs in CloudFormation for links to test reports uploaded to your Dromedary S3 bucket.

Upon completion of a successful pipeline execution, Dromedary will be available by going to the Outputs tab on the master CloudFormation stack and clicking on the value for the `DromedaryAppURL` Output. If that hosted zone is not a publicly registered domain, you can access Dromedary via IP address. The IP address can be queried by viewing the EIP output of the ENI CloudFormation stack.

Every time changes are pushed to Github, CodePipeline will build, test, deploy and release those changes.

#### Configure Jenkins Security

**IMPORTANT**: It's very important that you enable Jenkins security.

From CodePipeline, click on any of the Actions to launch Jenkins. From Jenkins, perform the following steps to configure security:

1. Manage `Jenkins` > `Configure Global Security`
1. Check `Enable Security`
1. Click `Jenkins’ own user database`
1. Check `Allow users to sign up`
1. Check `Logged in users can do anything`
1. Click the `Save` button
1. Click `Sign Up` in the top right to create an account
1. Save and login as that user
1. Manage `Jenkins` > `Configure Global Security`
1. Check `Matrix Based Security`
1. Add a line for the user you just created 
1. Check the `Administer` box
1. Click the `Save` button

#### Cleanup
To delete (nearly) all Dromedary resources, delete any Dromedary application stacks and delete the master CloudFormation stack. The only resources that remain and require manual deletion is the Dromedary S3 bucket.

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
