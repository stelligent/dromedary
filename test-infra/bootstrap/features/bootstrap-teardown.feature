@teardown
Feature: AWS Test Drive Dromedary Bootstrapper Self-Termination

	Background:
		Given I am the bootstrapping instance

	Scenario:
		When I have finished bootstrapping Dromedary teardown
		Then I should not see a "iam" cloudformation stack
		And I should not see a "vpc" cloudformation stack
		And I should not see a "ddb" cloudformation stack
		And I should not see a "jenkins" cloudformation stack
		And I should not see a "pipeline" cloudformation stack
		And I should no longer have an environment file from the bootstrapper