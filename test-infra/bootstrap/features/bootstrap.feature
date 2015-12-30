@build
Feature: AWS Test Drive Dromedary Bootstrapper

	Background:
		Given I am the bootstrapping instance

	Scenario:
		When I have finished bootstrapping Dromedary
		Then I should see a "iam" cloudformation stack with status "CREATE_COMPLETE"
		And I should see a "vpc" cloudformation stack with status "CREATE_COMPLETE"
		And I should see a "ddb" cloudformation stack with status "CREATE_COMPLETE"
		And I should see a "jenkins" cloudformation stack with status "CREATE_COMPLETE"
		And I should see a "pipeline" cloudformation stack with status "CREATE_COMPLETE"
		And I should see the dromedary s3 bucket created
		And I should have an environment file from the bootstrapper
		And the bootstrapping instance should be waiting to self-terminate