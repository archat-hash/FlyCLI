# test/hardware_verification/phase2_config.feature
Feature: Phase 2 - Configuration Reading
  As a developer
  I want to audit the full configuration of the flight controller
  So that I can verify its integrity and resource mappings

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
  Scenario: Audit Resource Mappings (Hardware Specific)
    When I execute the CLI command "resource show"
    Then the output should contain "A15: FREE"
    And the output should contain "B03: FREE"
  Scenario: Audit DMA & Timers
    When I execute the CLI command "dma"
    Then the data should be returned without errors
    When I execute the CLI command "timer"
  Scenario: Audit Serial Ports configuration (VCP check)
    When I execute the CLI command "serial"
    Then the output should contain "serial 20"
  Scenario: Verify Bulk Configuration (Dump & Diff)
    When I execute the CLI command "diff all"
    Then the output should be longer than 50 characters
    When I execute the CLI command "dump"
    Then the output should be longer than 500 characters
  Scenario: Audit Parameters (Get command)
    When I execute the CLI command "get motor_pwm_protocol"
    Then the output should contain "motor_pwm_protocol = DISABLED"
    When I execute the CLI command "get gyro_hardware_lpf"
    Then the output should contain "gyro_hardware_lpf"
  Scenario: Audit Beeper & Beacon status
    When I execute the CLI command "beeper list"
    Then the output should contain "GYRO_CALIBRATED"
    When I execute the CLI command "beacon list"
    Then the output should be valid metadata
