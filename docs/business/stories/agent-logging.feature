Feature: Agent Command Logging
  In order to audit AI Agent actions
  As a Project Manager
  I want every CLI execution to be appended to a JSONL log

  Scenario: Transparent execution logging
    Given the CLI is executed with the "--json" flag
    When the command completes successfully
    Then the AgentWorkflowService generates an EventMessage
    And delegates persistence to "AgentStorage.js"
    And "AgentStorage.js" appends the stdout, stderr, and exitCode to "~/.flycli/agent_logs/workflow_current.jsonl"
    
  Scenario: JSONL File Rotation
    Given the "workflow_current.jsonl" reaches the maximum byte limit (1 MB)
    When "AgentStorage.js" attempts to write a new EventMessage
    Then it renames the current file with a timestamp
    And creates a new empty "workflow_current.jsonl" before writing
