import { jest } from '@jest/globals';
import MessengerService from '../../src/application/factory/MessengerService.js';
import EventMessage from '../../src/domain/factory/EventMessage.js';

describe('MessengerService', () => {
  let storageMock;
  let messenger;

  beforeEach(() => {
    storageMock = {
      saveMessage: jest.fn().mockResolvedValue(),
      getMessages: jest.fn().mockResolvedValue([
        new EventMessage({ senderRole: 'BA', content: 'reqs' }).toJSON(),
      ]),
    };
    messenger = new MessengerService(storageMock);
  });

  it('should post a message successfully', async () => {
    const res = await messenger.postMessage({ senderRole: 'Developer', content: 'Done' });
    expect(res).toBeInstanceOf(EventMessage);
    expect(res.senderRole).toBe('Developer');
    expect(storageMock.saveMessage).toHaveBeenCalledWith(expect.any(EventMessage));
    expect(storageMock.saveMessage.mock.calls[0][0].senderRole).toBe('Developer');
    expect(storageMock.saveMessage.mock.calls[0][0].content).toBe('Done');
  });

  it('should get chat context successfully', async () => {
    const ctx = await messenger.getChatContext(10);
    expect(storageMock.getMessages).toHaveBeenCalledWith(10);
    expect(ctx).toContain('BA');
    expect(ctx).toContain('reqs');
  });

  it('should throw if storage is missing', () => {
    expect(() => new MessengerService()).toThrow('Storage dependency required');
  });

  it('should return empty message when no messages exist', async () => {
    storageMock.getMessages.mockResolvedValue([]);
    const ctx = await messenger.getChatContext(10);
    expect(ctx).toBe('No messages yet.\n');
  });
});
