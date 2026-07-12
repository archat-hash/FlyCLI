import EventMessage from '../../domain/factory/EventMessage.js';

export default class MessengerService {
  /**
   * @param {import('../../infrastructure/storage/FactoryStorage.js').default} storage
   */
  constructor(storage) {
    if (!storage) throw new Error('Storage dependency required');
    this.storage = storage;
  }

  async postMessage({
    senderRole, content, recipientRole = null, ticketId = 'global', artifacts = [],
  }) {
    const msg = new EventMessage({
      senderRole,
      content,
      recipientRole,
      ticketId,
      artifacts,
    });
    await this.storage.saveMessage(msg);
    return msg;
  }

  async getChatContext(limit = 20) {
    const msgs = await this.storage.getMessages(limit);
    if (msgs.length === 0) return 'No messages yet.\n';

    let output = '=== MESSENGER CONTEXT ===\n\n';
    msgs.forEach((m) => {
      const msgObj = new EventMessage(m);
      output += `${msgObj.toString()}\n`;
    });
    return output;
  }
}
