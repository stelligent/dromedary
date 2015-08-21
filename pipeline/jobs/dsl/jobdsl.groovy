def jobs =  [ "unit-test", "static-analysis", "acceptance-test"]

jobs.each { currentJob ->

  job {
    println "configuring ${currentJob}"
    name "${currentJob}-dsl"

    configure { job ->
      scm = (job / scm)

      (scm / 'clearWorkspace').setValue("true")
      (scm / 'actionTypeCategory').setValue("build")
      (scm / 'actionTypeProvider').setValue(currentJob)
      (scm / 'actionTypeVersion').setValue("1")


      (scm / 'model' / 'region').setValue("us-east-1")
      (scm / 'model' / 'compressionType').setValue("None")
      (scm / 'model' / 'actionTypeCategory').setValue("Build")

      (scm / 'model' / 'outputBuildArtifacts' / 'compressionType ').setValue("None")
      (scm / 'model' / 'outputBuildArtifacts' / 'com.amazonaws.services.codepipeline.model.Artifact' / 'name').setValue("dromedary")
      (scm / 'model' / 'outputBuildArtifacts' / 'com.amazonaws.services.codepipeline.model.Artifact' / 'location' / 'type').setValue("S3")

      (job / scm).@class = 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelineSCM'
      (job / scm).@plugin = 'codepipeline@0.2'

      pub = (job / publishers / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher")

      (pub).@class = 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher'
      (pub).@plugin = 'codepipeline@0.2'
      
      (pub / buildOutputs / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher_-OutputTuple" / "outputString").setValue("")
     }
    triggers {
      scm("* * * * *")
    }
    steps {
      shell("pipeline/jobs/scripts/${currentJob}.sh")
    }
  }
}
