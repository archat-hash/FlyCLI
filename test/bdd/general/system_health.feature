Feature: Health Check Command
  As a pilot
  I want to run a health check on my flight controller
  So that I can identify potential issues before flight

  Scenario: Run successful health check
    Given a flight controller connected to "/dev/tty.usbmodem0x80000001"
    And the controller returns valid "version" and "tasks" output
    When I run the "health" command
    Then I should receive a JSON report
    And the report should contain "version" and "tasks"
    And the controller should have executed "version" and "tasks" commands
