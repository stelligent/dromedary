

Scenario: Conditional Startup
  Given pEnableCloudFrontAndWaf is false
  When I converge dromedary-master stack
  Then the CloudFront and WAF nested stacks are not converged

  Given pEnableCloudFrontAndWaf is not specified
  When I converge dromedary-master stack
  Then the CloudFront and WAF nested stacks are not converged

  Given pEnableCloudFrontAndWaf is true
  When I converge dromedary-master stack
  Then the CloudFront and WAF nested stacks are converged