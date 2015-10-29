@teardown
Feature: AWS Test Drive Dromedary Bootstrapper Self-Termination

	Background:
		Given I am the bootstrapping instance

	Scenario:
		When I have finished bootstrapping Dromedary teardown
		Then I should see a "iam" cloudformation stack with status "DELETE_COMPLETE"
		And I should see a "vpc" cloudformation stack with status "DELETE_COMPLETE"
		And I should see a "ddb" cloudformation stack with status "DELETE_COMPLETE"
		And I should see a "jenkins" cloudformation stack with status "DELETE_COMPLETE"
		And I should no longer have an environment file from the bootstrapper