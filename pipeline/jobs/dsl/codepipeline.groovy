//def jobs =  [ "unit-test", "static-analysis", "acceptance-test"]
def jobs =  [ "unit-test"]

jobs.each { currentJob ->

  freeStyleJob("${currentJob}-dsl") {
    scm {
      configure { scm ->

        (scm / 'clearWorkspace').setValue("true")
        (scm / 'actionTypeCategory').setValue("Build")
        (scm / 'actionTypeProvider').setValue("THIS_NEEDS_TO_BE_AN_INPUT")
        (scm / 'projectName').setValue(currentJob)
        // what does this value mean?
        (scm / 'actionTypeVersion').setValue("1") 
        // is this needed when no proxy configured?
        (scm / 'proxyPort').setValue("0") 

        (scm / 'region').setValue("us-east-1")

        // do we need a blank <awsClientFactory/>?

        (scm).@'class' = 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelineSCM'
        (scm).@plugin = 'codepipeline@0.8'
       }
     }
    publishers {
      configure { pub ->
        pub = (job / publishers / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher")
        (pub).@plugin = 'codepipeline@0.8'
        
        (pub / buildOutputs / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher_-OutputTuple" / "outputString").setValue("")
        (pub / model).@reference = "../../../scm/model"
        // do we need a blank <awsClientFactory/>?


      }
    }
    triggers {
      scm("* * * * *")
    }
    steps {
      shell("chmod u+x ./pipeline/jobs/scripts/${currentJob}.sh && ./pipeline/jobs/scripts/${currentJob}.sh")
    }
  }
}

println "generated xml"