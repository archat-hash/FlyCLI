Feature: Serial Port Discovery
  As a pilot or AI agent
  I want to find connected flight controllers
  So that I can connect and interact with them

  Scenario: Listing available serial ports
    Given the flight controller is connected to port "/dev/tty.usbmodem0x80000001"
    When I run the "scan" command
    Then I should see "/dev/tty.usbmodem0x80000001" in the output
    And the response should contain "Betaflight"
