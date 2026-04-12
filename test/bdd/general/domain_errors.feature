Feature: Domain Error Hierarchy

  Scenario: TimeoutError is identifiable as FlyCliError
    Given a TimeoutError is thrown with a message
    Then it should be an instance of FlyCliError
    And it should have the correct name

  Scenario: ConnectionError is identifiable as FlyCliError
    Given a ConnectionError is thrown with a message
    Then it should be an instance of FlyCliError
    And it should have the correct name

  Scenario: DeviceError is identifiable as FlyCliError
    Given a DeviceError is thrown with a message
    Then it should be an instance of FlyCliError
    And it should have the correct name
