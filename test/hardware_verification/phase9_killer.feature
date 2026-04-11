# test/hardware_verification/phase9_killer.feature
Feature: Phase 9 - High-Risk "Killer" Commands
  As a developer
  I want to verify the commands that trigger reboots or permanent state changes
  So that I can confirm the firmware's lifecycle management

  # WARNING: These scenarios may result in loss of connection or require firmware reflashing.
  # Use with caution.

  Background:
    Given the flight controller is connected via "/dev/tty.usbmodem0x80000001" at 115200 baud

  @risk-high
  Scenario: Verify Reboot Trigger (exit)
    When I execute the reboot command "exit"
    Then the connection should be closed by the firmware

  @risk-high
  Scenario: Verify Save Trigger (save)
    When I execute the reboot command "save"
    Then the connection should be closed by the firmware

  @risk-high
  Scenario: Verify Bootloader Trigger (bl)
    When I execute the reboot command "bl"
    Then the connection should be closed by the firmware
    And the device should enter DFU mode

  @risk-bricking
  Scenario: Verify Defaults Reset (defaults)
    # WARNING: On STM32F411 Black Pill, this will LOSE USB VCP!
    When I execute the reboot command "defaults"
    Then the connection should be closed by the firmware
    And I should be notified to reflash via DFU
