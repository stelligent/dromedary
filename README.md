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

Since ideally we want CodePipeline to facilitate our deployments, we'll need to create a new pipeline. Unfortunately, there's no good easy way to do this via the CLI, so here's the directions for doing it via [the Code Pipeline console](https://console.aws.amazon.com/codepipeline/home?region=us-east-1#/dashboard). You will also need a [GitHub account](https://www.github.com).

* Click Create Pipeline
* For pipeline name, enter `dromedary` (or whatever you like) and click next.
* So we have to set up a source provider. For Source Provider, select `github`
* Click "connect to github" and you'll be prompted to log in and allow access for CodePipeline.
* For repository enter `stelligent/dromedary` and for branch enter `master` and then click next.
* Now we set up a build provider. For build provider, click "Add Jenkins"
* For provider name, enter `DromedaryJenkins`
* For server URL, enter this command to get the server URL:
 
    aws cloudformation describe-stacks --stack-name $STACKNAME --output text --query Stacks[*].Outputs[?OutputKey==\'JenkinsURL\'].OutputValue

* For project name, enter `build` and click next.
* Now we set up a deployment provider. For Deployment Provider, select AWS CodeDeploy.
* For Application name, enter `dromedary`
* For Deployment group, enter `dromedary-beta` and click next.
* Finally we have to configure the service role. In Role Name, enter `AWS-CodePipeline-Service` and click next.
* Review your options and click "Create Pipeline"

That handles the CodePipeline end, but we also have to configure Jenkins to pull the job.

To get the URL of your Jenkins server, you can run this command:

    aws cloudformation describe-stacks --stack-name $STACKNAME --output text --query Stacks[*].Outputs[?OutputKey==\'JenkinsURL\'].OutputValue

Alternatively, you can look up it up in the CloudFormation console.

Once you have CodePipeline set up, we'll need to tackle setting up Jenkins.

* Click New Item.
* For item name, enter `build`
* Select Freestyle project and click next.

We'll need to do three things in the job setup:

* First, set up the Source Code Management
** Under "Source Code Management" select "AWS CodePipeline"
** Under "Category" select "Build"
** Under "Provider" enter `DromedaryJenkins` (this needs to match what you entered when creating your Jenkins Provider when configuring your CodePipeline, so double check spelling).
** Under "Build Triggers", select "Poll SCM"
** Under schedule, enter `* * * * *`
* Second, set up the build step
** Click "Add build step" and select "Execute Shell"
** Under command, enter `zip -qr dromedary.zip *`
* Finally, set up the Post-build action:
** Click "Add Post Build Action" and select "AWS CodePipeline Publisher"
** Click "Add"
** Enter `dromedary.zip`

Once that's done, click "Save".
 
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

The `dist` task copies relevant files to `dist/` and installs only dependencies required to run the standalone
app:

1. Run `gulp dist`

`dist/archive.tar.gz` will be created if this task run successfully.
