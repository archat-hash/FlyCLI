# test/hardware_verification/phase8_writing.feature
Feature: Phase 8 - Safe Configuration Writing
  As a developer
  I want to verify that I can modify configuration parameters in RAM
  So that I can test changes without risking a permanent brick

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
  Scenario: Verify parameter modification (RAM only)
    When I execute the CLI command "get debug_mode"
    Then the output should not be empty
    When I execute the CLI command "set debug_mode = NONE"
    Then the output should contain "debug_mode"
    And the output should contain "NONE"
    Then the output should contain "debug_mode set to NONE"

  Scenario: Cleanup (Implicitly done by reboot/disconnection if not saved)
    Given the controller is disconnected
    And the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
