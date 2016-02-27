Feature: Pen test the Dromedary Application

  Scenario: Check our scanner ran successfully
    Given we ran the scanner
     Then we have valid json alert output

  Scenario: The application should not contain Cross Domain Scripting vulnerabilities
    Given we have valid json alert output
     When there is a cross domain source inclusion vulnerability
     Then none of these risk levels should be present
        | risk |
        | Medium |
        | High |

  Scenario: The application shouldn't have any high or higher risk vulnerabilities
    Given we have valid json alert output
     When there are vulnerabilities
     Then none of these risk levels should be present
        | risk |
        | High |

  Scenario: The application should have the X-Frame-Options header set
    Given we have valid json alert output
    When there is not an X-Frame-Options Header set
    Then none of these risk levels should be present
        | risk |
        | High |

  Scenario: The application should have the X-Content-Type-Options set
    Given we have valid json alert output
    When there is not an X-Content-Type-Options Header set
    Then none of these risk levels should be present
        | risk |
        | Medium |
        | High |
