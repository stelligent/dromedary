def jobs =  [ "unit-test", "static-analysis", "acceptance-test"]

jobs.each { currentJob ->

    job {
      println "configuring ${currentJob}"
      name "${currentJob}-dsl"
      scm {
        // how do we get the AWS plugin in here?
      }
      triggers {
        scm("* * * * *")
      }
      steps {
        shell("pipeline/jobs/scripts/${currentJob}.sh")
      }
      wrappers {
        rvm("2.2.2")
      }
      publishers {
        // Need publisher for AWS plugin here too
      }
    }
  }
}

