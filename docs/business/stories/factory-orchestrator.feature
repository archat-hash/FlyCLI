Feature: Factory Orchestrator
  In order to manage AI tasks
  As the boss
  I want to initialize and track epics

  Scenario: Initialize new epic
    When the user executes "flycli factory init <epicName>"
    Then "FactoryOrchestrator.js" creates a new TicketState
    And "FactoryStorage.js" initializes a new JSONL file for the epic
    And the epic status is set to DRAFT
