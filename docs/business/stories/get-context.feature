Feature: Get Context Query
  In order to understand the current state
  As an AI Agent
  I want to read the entire conversation history of an epic

  Scenario: Read context
    When the agent executes "flycli agent context <epicName>"
    Then "GetContextQuery.js" reads the corresponding JSONL file from "FactoryStorage.js"
    And returns the chronologically ordered messages in a format suitable for LLM context
