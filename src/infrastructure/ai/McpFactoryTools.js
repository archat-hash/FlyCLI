/* eslint-disable import/prefer-default-export */
import FactoryStorage from '../storage/FactoryStorage.js';
import MessengerService from '../../application/factory/MessengerService.js';
import FactoryOrchestrator from '../../application/factory/FactoryOrchestrator.js';

export class McpFactoryTools {
  constructor() {
    this.storage = new FactoryStorage();
    this.messenger = new MessengerService(this.storage);
    this.orchestrator = new FactoryOrchestrator(this.storage, this.messenger);
  }

  static getToolDefinitions() {
    return [
      this.getPostMessageDef(),
      this.getGetContextDef(),
      this.getTransitionStateDef(),
    ];
  }

  static getPostMessageDef() {
    return {
      name: 'factory_post_message',
      description: 'Post a message to the AI Software Factory event bus.',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Your role' },
          content: { type: 'string', description: 'The message' },
          recipient: { type: 'string', description: 'Optional recipient' },
          epicName: { type: 'string', description: 'The epic name' },
        },
        required: ['role', 'content', 'epicName'],
      },
    };
  }

  static getGetContextDef() {
    return {
      name: 'factory_get_context',
      description: 'Get the recent chat history for an Epic.',
      parameters: {
        type: 'object',
        properties: { epicName: { type: 'string' } },
        required: ['epicName'],
      },
    };
  }

  static getTransitionStateDef() {
    return {
      name: 'factory_transition_state',
      description: 'Attempt to transition the state of the ticket.',
      parameters: {
        type: 'object',
        properties: {
          epicName: { type: 'string' },
          newState: { type: 'string' },
          role: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['epicName', 'newState', 'role'],
      },
    };
  }

  async postMessage({
    role, content, recipient, epicName,
  }) {
    await this.messenger.postMessage({
      senderRole: role, content, recipientRole: recipient, ticketId: epicName,
    });
    return { success: true, message: 'Message posted to the event bus.' };
  }

  async getContext() {
    const context = await this.messenger.getChatContext(50);
    return { success: true, context };
  }

  async transitionState({
    epicName, newState, role, reason,
  }) {
    const finalState = await this.orchestrator.transitionState({
      epicName,
      newState,
      requestedByRole: role,
      reason,
    });
    return { success: true, state: finalState };
  }
}
