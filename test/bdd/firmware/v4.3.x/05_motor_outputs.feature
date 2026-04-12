# test/hardware_verification/phase7_motors.feature
Feature: Phase 7 - Mixer & Motors
  As a developer
  I want to verify the mixer and motor configuration
  So that I can ensure the power system is correctly mapped

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
  Scenario: Audit Mixer Configuration
    When I execute the CLI command "mixer list"
    Then the output should not be empty
  Scenario: Audit Motor Resources
    When I execute the CLI command "resource motor"
    Then the data should be returned without errors
  Scenario: Audit Servo Resources
    When I execute the CLI command "resource servo"
  Scenario: Audit Servo Mixer
    When I execute the CLI command "smix"
    Then the output should be valid metadata
