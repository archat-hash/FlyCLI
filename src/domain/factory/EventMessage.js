/**
 * @module EventMessage
 * Value Object representing a message in the Factory Messenger Event Bus.
 */

export default class EventMessage {
  /**
   * @param {Object} params
   * @param {string} params.senderRole - E.g. 'BA', 'Architect', 'Orchestrator'
   * @param {string} params.content - The message body
   * @param {string} [params.recipientRole] - E.g. '@Architect'
   * @param {string} [params.ticketId] - The Epic or Story ID
   * @param {string} [params.timestamp] - ISO date string
   * @param {string[]} [params.artifacts] - Array of file paths attached
   */
  constructor({
    senderRole,
    content,
    recipientRole = null,
    ticketId = 'global',
    timestamp = new Date().toISOString(),
    artifacts = [],
  }) {
    if (!senderRole) throw new Error('senderRole is required');
    if (!content && artifacts.length === 0) throw new Error('content or artifacts is required');

    this.senderRole = senderRole;
    this.content = content || '';
    this.recipientRole = recipientRole;
    this.ticketId = ticketId;
    this.timestamp = timestamp;
    this.artifacts = artifacts;
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      senderRole: this.senderRole,
      recipientRole: this.recipientRole,
      content: this.content,
      ticketId: this.ticketId,
      artifacts: this.artifacts,
    };
  }

  /**
   * Helper to format for LLM context
   */
  toString() {
    const recipient = this.recipientRole ? `[to ${this.recipientRole}] ` : '';
    const attachments = this.artifacts && this.artifacts.length > 0 ? ` (Attachments: ${this.artifacts.join(', ')})` : '';
    return `[${this.timestamp}] ${this.senderRole} ${recipient}: ${this.content}${attachments}`;
  }
}
