
Scenario: Conditional Startup
  Given pEnableConfig is false
  When I converge dromedary-master stack
  Then the AWS config nested stacks are not converged

  Given pEnableConfig is not specified
   When I converge dromedary-master stack
   Then the AWS config nested stacks are converged

  Given pEnableConfig is true
   When I converge dromedary-master stack
   Then the AWS config nested stacks are converged
