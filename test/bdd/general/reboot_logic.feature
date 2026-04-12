Feature: Reboot Logic
  Background:
    Given a flight controller connected
    And the connection handshake is successful
    And the flight controller entered CLI mode

  Scenario: Save configuration triggers reboot
    When I execute the reboot command "save"
    Then the output should contain "[REBOOT_INITIATED]"
    And the controller should have disconnected within 3 seconds
