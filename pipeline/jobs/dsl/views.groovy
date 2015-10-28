listView('ops') {
    description('ops')
    jobs {
        name('job-seed')
        name('DA-commit-poll-scm')
        name('DA-selfservice-init')
    }
    columns {
        status()
        weather()
        name()
        lastSuccess()
        lastFailure()
        lastDuration()
        buildButton()
    }
}

listView('Dromedary') {
    description('Dromedary CodePipeline Jobs')
    jobs {
        regex('drom-.+')
    }
    columns {
        status()
        weather()
        name()
        lastSuccess()
        lastFailure()
        lastDuration()
        buildButton()
    }
}

deliveryPipelineView('Dummy App CD Pipeline') {
    pipelineInstances(5)
    columns(1)
    updateInterval(5)
    enableManualTriggers()
    pipelines {
        component('Dummy Application', 'DA-commit-poll-scm')
    }
}

deliveryPipelineView('Dummy App Self-Service') {
    pipelineInstances(5)
    columns(1)
    updateInterval(5)
    enableManualTriggers()
    pipelines {
        component('Dummy Application', 'DA-selfservice-init')
    }
}

listView('Dummy App Jobs') {
    description('Dummy Application')
    jobs {
        regex('DA.+')
    }
    columns {
        status()
        weather()
        name()
        lastSuccess()
        lastFailure()
        lastDuration()
        buildButton()
    }
}
