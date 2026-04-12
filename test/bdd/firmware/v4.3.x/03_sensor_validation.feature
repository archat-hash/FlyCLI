# test/hardware_verification/phase5_sensors.feature
Feature: Phase 5 - Sensors & Calibration
  As a developer
  I want to verify the health of all onboard sensors
  So that I can ensure the flight controller is ready for flight

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud
  Scenario: Audit Gyro & Accelerometer
    When I execute the CLI command "status"
    Then the output should contain "Gyros detected: locked"
    And the output should contain "Voltage:"
  Scenario: Audit Battery/Voltage sensor
    # Battery sensor not compiled/present on this Black Pill
