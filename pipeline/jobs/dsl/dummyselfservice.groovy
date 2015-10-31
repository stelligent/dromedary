// Dummy Application (DA)(DummySelfService)

freeStyleJob ('DA-selfservice-init') {
    steps {
        shell('sleep 1')
    }
    publishers {
        downstream('DA-selfservice-create-env', 'SUCCESS')
    }
	deliveryPipelineConfiguration('Self-Service Pipeline', 'request environment')
}

freeStyleJob ('DA-selfservice-create-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-selfservice-node-config-env', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'provision environment')
}

freeStyleJob ('DA-selfservice-node-config-env') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-selfservice-load-db', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'configure environment')
}

freeStyleJob ('DA-selfservice-load-db') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-selfservice-migrate-db', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'load test db')
}

freeStyleJob ('DA-selfservice-migrate-db') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-selfservice-deploy-app', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'migrate test db')
}

freeStyleJob ('DA-selfservice-deploy-app') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	publishers {
        downstream('DA-selfservice-smoketest', 'SUCCESS')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'deploy application')
}

freeStyleJob ('DA-selfservice-smoketest') {
	steps {
        customWorkspace('dummypipeline')
		shell('sleep 1.5')
	}
	deliveryPipelineConfiguration('Self-Service Pipeline', 'smoke test environment')
}
