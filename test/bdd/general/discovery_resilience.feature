Feature: Hardware Discovery Resilience
  As a developer
  I want the test suite to robustly detect flight controllers
  So that I don't get false negatives due to transient environment issues

  Scenario: Robustly finding connected hardware
    When I perform a robust hardware discovery
    Then the port "/dev/tty.usbmodem0x80000001" should be available in the system
