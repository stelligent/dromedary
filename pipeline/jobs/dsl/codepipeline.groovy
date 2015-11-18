job('example') {
  triggers {
    scm("* * * * *")
  }
  steps {
    shell("hello world")
  }

configure { project ->
  project.remove(project / scm) // remove the existing 'scm' element
  project / scm(class: 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelineSCM', plugin: 'codepipeline@0.8') {
    clearWorkspace true 
    actionTypeCategory 'Build'
    actionTypeProvider "JenkinsJPSTUE564bc1e4"
    projectName currentJob
    actionTypeVersion 1
    proxyPort 0
    region "us-east-1"
  }
  project.remove(project / publishers)
  project / publishers / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher"(plugin:'codepipeline@0.8') {
    buildOutputs {
      "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher_-OutputTuple" {
        outputString ""
        }
      }
    }
  }
}