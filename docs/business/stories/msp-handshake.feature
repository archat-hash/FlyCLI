Feature: MSP Protocol Handshake
  In order to safely execute commands
  As the core application
  I want to verify the device speaks MSP before sending payloads

  Scenario: Successful Handshake
    Given the port "/dev/ttyACM0" is available
    When the system sends an MSP request for "API_VERSION"
    And a valid MSP response is received within 1000ms
    Then the connection state is marked as "VERIFIED"

  Scenario: Handshake Timeout
    Given the port "/dev/ttyACM0" is connected to a non-FC device
    When the system sends an MSP request for "API_VERSION"
    And 2000ms elapse with no response
    Then the system generates a "TimeoutError"
    And closes the serial port immediately
