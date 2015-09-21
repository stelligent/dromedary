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

To manually push a deployment of the Dromedary application using CodeDeploy, run this command. 

Note: You'll need an S3 bucket set up to hold your artifact, and insert that bucket name on the second and last lines.

    zip -qr ../dromedary.zip * && \
    aws s3 cp ../dromedary.zip s3://your-s3-bucket && \
    aws deploy create-deployment --application-name dromedary \
        --deployment-group-name dromedary-beta \
        --description "Deploy application to instances" \
        --s3-location bundleType=zip,bucket=your-s3-bucket,key=dromedary.zip

Since ideally we want CodePipeline to facilitate our deployments, we'll need to create a new pipeline. Unfortunately, there's no good easy way to do this via the CLI, so here's the directions for doing it via [the Code Pipeline console](https://console.aws.amazon.com/codepipeline/home?region=us-east-1#/dashboard). You will also need a [GitHub account](https://www.github.com).

* Click the **Create pipeline** button
* For pipeline name, enter `dromedary` (or whatever you like) and click next.
* So we have to set up a source provider. For Source Provider, select `github`
* Click the **connect to GitHub** button and you'll be prompted to log in and allow access for CodePipeline.
* For repository enter `stelligent/dromedary` and for branch enter `master` and then click next.
* Now we set up a build provider. For build provider, click "Add Jenkins"
* For provider name, enter `DromedaryJenkins`
* For server URL, enter this command to get the server URL:

    aws cloudformation describe-stacks --stack-name $STACKNAME --output text --query Stacks[*].Outputs[?OutputKey==\'JenkinsURL\'].OutputValue

* For project name, enter `build` and click next.
* Now we set up a deployment provider. For Deployment Provider, select AWS CodeDeploy.
* For Application name, enter `dromedary`
* For Deployment group, enter `dromedary-beta` and click the **Next step** button.
* Finally we have to configure the service role. 
** If you already have one configured, just select it here (it's probably called `AWS-CodePipeline-Service`) and click next.
** If you don't have one, click "Create Role", "Allow", and then it'll auto-fill in the name (probably `AWS-CodePipeline-Service), and then click next.
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
** Leave the line blank. This will cause it to put the entire workspace into the artifact, which is what we want.g

Once that's done, click "Save".
 
#### Troubleshooting:

* I can't get to Jenkins using the IP address of the box!
** Make sure you're appending :8080 to the URL.
* The build job failed right away!
** The first run of the Job will fail due to some funkiness with the Polling of SCM. Since no build has ever been run, it will attempt to run the build, _but_ since there's nothing in the workspace, the build fails. If you wait two minutes, CodePipeline should trigger a build correctly, and populate the workspace.
* The Build step has been sitting there for several minutes and isn't doing anything!
** Make sure the provider name you have listed in your Jenkins Job matches _exactly_ to what you called it when you configured CodePipeline (probably `DromedaryJenkins`).
* I'm just seeing a "Congratulations, you have successfully launched the AWS CloudFormation sample" message, not the application
** Make sure you're appending :8080 to the URL.


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

The default task will start dynamodb-local on port 8079 and a node server listening on port 8080:

1. Run `gulp`
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
