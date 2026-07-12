Feature: CAD Process Orchestration
  In order to execute CAD commands without wasting RAM
  As the core application
  I want to start the FreeCAD process only when needed (Lazy Start)

  Scenario: Lazy Initialization of FreeCAD
    Given the MCP server is running
    And the FreeCAD sub-process is not currently active
    When an agent sends a CAD execution request
    Then "CadEngineProcess.js" starts the FreeCAD executable
    And waits for the standard output to indicate "Ready"
    And executes the requested Python script

  Scenario: Missing FreeCAD Binary
    Given the environment variable "FREECAD_PATH" points to a non-existent file
    When "EnvironmentManager.js" attempts to validate the path during initialization
    Then it throws a "ConfigurationError"
    And the CAD feature gracefully degrades, notifying the user
