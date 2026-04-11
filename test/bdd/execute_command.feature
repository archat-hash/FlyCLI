Feature: CLI Command Execution

  Scenario: Successfully execute command and get version
    Given the flight controller is connected to port "/dev/tty.usbmodem0x80000001"
    And the connection handshake is successful
    And the flight controller entered CLI mode
    When I execute the CLI command "version"
    Then the response should contain "Betaflight / STM32F411"

  Scenario: Successfully execute "tasks" command and get task list
    Given the flight controller is connected to port "/dev/tty.usbmodem0x80000001"
    And the connection handshake is successful
    And the flight controller entered CLI mode
    When I execute the CLI command "tasks"
    Then the response should contain "Task list"
    And the response should contain "SYSTEM"
    And the response should contain "SERIAL"
