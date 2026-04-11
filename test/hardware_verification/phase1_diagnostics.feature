# test/hardware_verification/phase1_diagnostics.feature
Feature: Phase 1 - Diagnostic Reading
  As a developer
  I want to verify that all diagnostic commands return valid data from the firmware
  So that I can ensure the telemetry layer is fully functional

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud

  Scenario: Verify System Identity (Version & Board)
    When I execute the CLI command "version"
    Then the output should contain "Betaflight"
    And the output should contain "STM32F411"
    And the output should contain "MSP API: 1.44"

  Scenario: Verify System Status & Health
    When I execute the CLI command "status"
    Then the output should contain "MCU F411"
    And the output should contain "Voltage:"
    And the output should contain "System Uptime:"
    And the output should contain "I2C Errors: 0"

  Scenario: Verify Microcontroller Details
    When I execute the CLI command "mcu_id"
    Then the output should match "[0-9a-f]{24}"

  Scenario: Verify CPU Tasks Stats
    When I execute the CLI command "tasks"
    Then the output should contain "Task"
    And the output should contain "PID"
    And the output should contain "GYRO"

  Scenario: Verify External Storage (SD/Flash)
    When I execute the CLI command "flash_info"
    Then the output should contain "Flash"
    When I execute the CLI command "sd_info"
    Then the data should be returned without errors

  Scenario: Verify Identification Metadata (Optional fields)
    When I execute the CLI command "board_name"
    Then the output should be valid metadata
    When I execute the CLI command "manufacturer_id"
    Then the output should be valid metadata
    When I execute the CLI command "signature"
    Then the output should be valid metadata
