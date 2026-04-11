Feature: Save and Reboot
  As a developer
  I want to save my configuration
  So that the flight controller reboots and applies changes

  Scenario: Save configuration triggers reboot
    Given a flight controller connected to "/dev/tty.usbmodem0x80000001"
    When I run the "execute save" command
    Then I should see "Rebooting..." in the output
    And the controller should have disconnected within 3 seconds
