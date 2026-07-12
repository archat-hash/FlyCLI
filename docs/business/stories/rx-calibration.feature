Feature: Interactive RC Calibration
  In order to verify radio transmitter inputs
  As a pilot
  I want a terminal UI to visualize stick positions

  Scenario: Full calibration success
    Given the "rxCalibrationMachine.js" is in the polling state
    When the user moves Roll, Pitch, Yaw, and Throttle to their extremums (<1100 and >1900)
    Then "terminalIndicator.js" renders visual progress bars to stderr
    And upon completion, outputs a valid JSON object to stdout

  Scenario: Calibration Timeout
    Given the calibration wizard is running
    When no stick movement is detected for 15 seconds
    Then the finite state machine transitions to TIMEOUT
    And outputs a JSON object with status "timeout"
