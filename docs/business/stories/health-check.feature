Feature: System Health Check
  In order to verify system readiness
  As an automated agent or user
  I want to get a structured JSON response with subsystem statuses

  Scenario: System is healthy
    When the user executes "flycli health"
    Then "GetHealthCheckUseCase.js" collects system metrics
    And outputs a JSON object containing Node.js version, SerialPort availability, and workspace status
