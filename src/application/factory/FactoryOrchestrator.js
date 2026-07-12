import { TicketState, STATES } from '../../domain/factory/TicketState.js';

export default class FactoryOrchestrator {
  /**
   * @param {import('../../infrastructure/storage/FactoryStorage.js').default} storage
   * @param {import('./MessengerService.js').default} messenger
   */
  constructor(storage, messenger) {
    this.storage = storage;
    this.messenger = messenger;
  }

  async startEpic(epicName) {
    const existingState = await this.storage.getState(epicName);
    if (existingState) {
      throw new Error(`Epic ${epicName} already exists in state ${existingState}`);
    }

    const state = new TicketState(STATES.DRAFT);
    await this.storage.saveState(epicName, state.get());

    await this.messenger.postMessage({
      senderRole: 'Orchestrator',
      content: `Starting new Epic: ${epicName}.`,
      recipientRole: '@BA',
      ticketId: epicName,
    });

    return state.get();
  }

  async transitionState({
    epicName, newState, requestedByRole, reason = '',
  }) {
    const currentStateStr = await this.storage.getState(epicName);
    if (!currentStateStr) {
      throw new Error(`Epic ${epicName} not found`);
    }

    const stateObj = new TicketState(currentStateStr);

    try {
      stateObj.transition(newState);
    } catch (e) {
      await this.messenger.postMessage({
        senderRole: 'Orchestrator',
        content: `❌ Invalid state transition from ${currentStateStr} to ${newState} requested by ${requestedByRole}.`,
        recipientRole: null,
        ticketId: epicName,
      });
      throw e;
    }

    await this.storage.saveState(epicName, stateObj.get());

    const reasonText = reason ? ` Reason: ${reason}` : '';
    await this.messenger.postMessage({
      senderRole: 'Orchestrator',
      content: `State updated to ${newState} by ${requestedByRole}.${reasonText}`,
      recipientRole: null,
      ticketId: epicName,
    });

    return stateObj.get();
  }

  async getStatus(epicName) {
    return this.storage.getState(epicName);
  }
}
