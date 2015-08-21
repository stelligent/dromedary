//def jobs =  [ "unit-test", "static-analysis", "acceptance-test"]
def jobs =  [ "unit-test"]

jobs.each { currentJob ->

  freeStyleJob("${currentJob}-dsl") {
    scm {
      configure { scm ->

        (scm / 'clearWorkspace').setValue("true")
        (scm / 'actionTypeCategory').setValue("Build")
        (scm / 'actionTypeProvider').setValue(currentJob)
        (scm / 'actionTypeVersion').setValue("1")

        (scm / 'model' / 'AVAILABLE__REGIONS' / 'com.amazonaws.regions.Regions').setValue("US_EAST_1")
        parent = (scm / 'model' / 'ACTION__TYPE')
        new Node(parent, 'com.amazonaws.codepipeline.jenkinsplugin.CodePipelineStateModel_-CategoryType', "PleaseChooseACategory")
        new Node(parent, 'com.amazonaws.codepipeline.jenkinsplugin.CodePipelineStateModel_-CategoryType', "Build")
        new Node(parent, 'com.amazonaws.codepipeline.jenkinsplugin.CodePipelineStateModel_-CategoryType', "Test")

        (scm / 'model' / 'region').setValue("us-east-1")
        (scm / 'model' / 'compressionType').setValue("None")
        (scm / 'model' / 'actionTypeCategory').setValue("Build")

        (scm / 'model' / 'outputBuildArtifacts' / 'compressionType ').setValue("None")
        (scm / 'model' / 'outputBuildArtifacts' / 'actionTypeCategory ').setValue("Build")

        (scm / 'model' / 'outputBuildArtifacts' / 'com.amazonaws.services.codepipeline.model.Artifact' / 'name').setValue("dromedary-build")
        (scm / 'model' / 'outputBuildArtifacts' / 'com.amazonaws.services.codepipeline.model.Artifact' / 'location' / 'type').setValue("S3")

        (scm).@'class' = 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelineSCM'
        (scm).@plugin = 'codepipeline@0.2'
       }
     }
    publishers {
      configure { pub ->
        // pub = (job / publishers / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher")
        
        //(pub).@class = 'com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher'
        (pub).@plugin = 'codepipeline@0.2'
        
        (pub / buildOutputs / "com.amazonaws.codepipeline.jenkinsplugin.AWSCodePipelinePublisher_-OutputTuple" / "outputString").setValue("")
        (pub / model).@reference = "../../../scm/model"


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
