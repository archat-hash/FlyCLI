Feature: Port Scanning and Detection
  In order to connect to a flight controller
  As an automated agent
  I want the CLI to list all available serial ports and highlight FC candidates

  Scenario: Successful detection of FC ports
    Given the system has access to the SerialPort library
    When the user executes "flycli scan"
    Then the system calls PortScanner
    And outputs a JSON list of all available ports
    And tags ports whose 'manufacturer' matches known FC vendors (e.g. STM32) with "[FC Candidate]"

  Scenario: Port Connection Error Handling (Port Busy)
    Given the user attempts to connect to an [FC Candidate] port
    But the port is locked by another process (e.g., Betaflight Configurator)
    When "SerialFlightController.js" attempts to open the port
    Then it throws a specific "ConnectionError" indicating "Port Busy"
    And the CLI handles the error gracefully without crashing

  Scenario: No devices connected
    Given no USB serial devices are connected to the system
    When the user executes "flycli scan"
    Then the system outputs "No serial ports found"
    And exits with status code 0
