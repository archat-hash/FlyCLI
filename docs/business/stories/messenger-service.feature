Feature: Messenger Service
  In order to communicate within the Factory
  As an AI Agent
  I want to post messages to the epic's event bus

  Scenario: Post standard message
    When an agent calls "MessengerService.js" to post a message
    Then the message is appended to the epic's JSONL file with the agent's role and timestamp

  Scenario: Attach file to message
    When an agent posts a message with a file attachment path
    Then "MessengerService.js" validates the file existence
    And embeds the file reference into the EventMessage
