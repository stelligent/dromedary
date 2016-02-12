Feature: Pen test the Dromedary Application

  Scenario: Check our scanner ran successfully
    Given we ran the scanner
     Then we have valid json alert output

  Scenario: The application should not contain Cross Site Scripting vulnerabilities
    Given we have valid json alert output
     When there is a cross-site-script vulnerability
     Then none of these risk levels should be present
        | risk |
        | Medium |
        | High |

  Scenario: The Application shouldn't have any high or higher risk vulnerabilities
    Given we have valid json alert output
     When there are vulnerabilities
     Then none of these risk levels should be present
        | risk |
        | High |
