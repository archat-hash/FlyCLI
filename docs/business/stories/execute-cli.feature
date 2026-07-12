Feature: Execute Raw CLI Command
  In order to interact with the flight controller
  As a user or agent
  I want to send arbitrary text commands and receive the output

  Scenario: Successful command execution
    Given an active connection to the flight controller
    When "ExecuteCliUseCase.js" receives a command string (e.g. "status")
    Then it sends the command over the serial port
    And reads the buffer until the prompt character "# " is encountered
    And returns the sanitized string excluding the echo

  Scenario: Connection lost during execution
    Given the flight controller is unplugged during execution
    When "SerialFlightController.js" attempts to read the buffer
    Then it throws a "ConnectionError"
    And "ExecuteCliUseCase.js" returns the error details gracefully
