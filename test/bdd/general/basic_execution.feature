Feature: Basic Command Execution
  Background:
    Given a flight controller connected
    And the connection handshake is successful
    And the flight controller entered CLI mode

  Scenario: Execute status command
    When I execute the CLI command "status"
    Then the response should contain "MCU"
    And the output should not be empty

  Scenario: Execute tasks command
    When I execute the CLI command "tasks"
    Then the output should contain "Task"
    And the response should contain "SYSTEM"
