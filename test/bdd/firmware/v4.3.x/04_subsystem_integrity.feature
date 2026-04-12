# test/hardware_verification/phase6_subsystems.feature
Feature: Phase 6 - Subsystems Verification
  As a developer
  I want to verify the configuration of all auxiliary subsystems
  So that I can identify missing or misconfigured hardware components

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud

  Scenario: Audit VTX Subsystem
    When I execute the CLI command "vtxtable"
    Then the data should be returned without errors
  Scenario: Audit Blackbox Logging
    When I execute the CLI command "get blackbox_device"
    Then the output should contain "blackbox_device"
  Scenario: Audit GPS Subsystem
    When I execute the CLI command "get gps_provider"
    Then the output should contain "gps_provider"
