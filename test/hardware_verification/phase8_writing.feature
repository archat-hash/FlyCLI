# test/hardware_verification/phase8_writing.feature
Feature: Phase 8 - Safe Configuration Writing
  As a developer
  I want to verify that I can modify configuration parameters in RAM
  So that I can test changes without risking a permanent brick

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud

  Scenario: Verify parameter modification (RAM only)
    When I execute the CLI command "get motor_pwm_protocol"
    Then the output should contain "motor_pwm_protocol = DISABLED"
    When I execute the CLI command "set motor_pwm_protocol = DSHOT600"
    Then the output should contain "motor_pwm_protocol"
    And the output should contain "DSHOT600"
    When I execute the CLI command "get motor_pwm_protocol"
    Then the output should contain "motor_pwm_protocol = DSHOT600"

  Scenario: Audit Multi-parameter setting
    When I execute the CLI command "set gyro_lowpass_type = PT1"
    Then the output should contain "gyro_lowpass_type"
    And the output should contain "PT1"

  Scenario: Cleanup (Implicitly done by reboot/disconnection if not saved)
    Given the controller is disconnected
    And the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
    When I execute the CLI command "get motor_pwm_protocol"
    Then the output should contain "motor_pwm_protocol = DISABLED"
