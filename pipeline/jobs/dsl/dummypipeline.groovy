// Dummy Application (DA)(DummyPipeline)

// Commit Stage
freeStyleJob ('DA-commit-poll-scm') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1')
	}
	publishers {
        downstream('DA-commit-create-build-artifact', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Commit', 'poll scm')
}

freeStyleJob ('DA-commit-create-build-artifact') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-commit-unit-tests', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Commit', 'create build artifact')
}

freeStyleJob ('DA-commit-unit-tests') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-commit-static-analysis', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Commit', 'unit tests')
}

freeStyleJob ('DA-commit-static-analysis') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-commit-upload-artifact', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Commit', 'static analysis')
}

freeStyleJob ('DA-commit-upload-artifact') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-integration-tests', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Commit', 'upload build artifact')
}

// Acceptance Testing
freeStyleJob ('DA-accept-integration-tests') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-create-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'integration tests')
}

freeStyleJob ('DA-accept-create-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-config-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'provision environment')
}

freeStyleJob ('DA-accept-config-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-infra-tests', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'configure environment')
}

freeStyleJob ('DA-accept-infra-tests') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-load-test-db', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'infrastructure tests')
}

freeStyleJob ('DA-accept-load-test-db') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-test-db-migrations', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'load test db')
}

freeStyleJob ('DA-accept-test-db-migrations') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-deploy-app', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'migrate test db')
}

freeStyleJob ('DA-accept-deploy-app') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-accept-automated-tests', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'deploy application')
}

freeStyleJob ('DA-accept-automated-tests') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-accept-terminate-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'acceptance tests')
}

freeStyleJob ('DA-accept-terminate-env') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-cap-create-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Acceptance Testing', 'terminate environment')
}

// Capacity Testing
freeStyleJob ('DA-cap-create-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-cap-node-config-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'provision environment')
}

freeStyleJob ('DA-cap-node-config-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-cap-load-db', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'configure environment')
}

freeStyleJob ('DA-cap-load-db') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-cap-db-migrations', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'load perftest db')
}

freeStyleJob ('DA-cap-db-migrations') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-cap-deploy-app', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'migrate perftest db')
}

freeStyleJob ('DA-cap-deploy-app') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-cap-capacity-tests', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'deploy application')
}

freeStyleJob ('DA-cap-capacity-tests') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-cap-terminate-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'capacity tests')
}

freeStyleJob ('DA-cap-terminate-env') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-preprod-create-rc-manifest', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Capacity Testing', 'terminate environment')
}

// Pre-Production
freeStyleJob ('DA-preprod-create-rc-manifest') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-preprod-approve-reject-rc', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Pre-Production', 'create RC manifest')
}

freeStyleJob ('DA-preprod-approve-reject-rc') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-prod-create-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Pre-Production', 'approve/reject RC')
}

// Production
freeStyleJob ('DA-prod-create-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-prod-node-config-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'provision environment')
}

freeStyleJob ('DA-prod-node-config-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-prod-migrate-db', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'configure environment')
}

freeStyleJob ('DA-prod-migrate-db') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-prod-deploy-app', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'migrate prod db')
}

freeStyleJob ('DA-prod-deploy-app') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-prod-smoketest', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'deploy application')
}

freeStyleJob ('DA-prod-smoketest') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-prod-blue-green-deployment', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'smoke test environment')
}

freeStyleJob ('DA-prod-blue-green-deployment') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-prod-approve-reject', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'blue/green deployment')
}

freeStyleJob ('DA-prod-approve-reject') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
		downstream('DA-prod-term-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Production', 'approve/reject deploy')
}

freeStyleJob ('DA-prod-term-env') {
	steps {
		customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	deliveryPipelineConfiguration('Production', 'terminate old env')
}
