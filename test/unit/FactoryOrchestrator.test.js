import { jest } from '@jest/globals';
import FactoryOrchestrator from '../../src/application/factory/FactoryOrchestrator.js';
import { STATES } from '../../src/domain/factory/TicketState.js';

describe('FactoryOrchestrator', () => {
  let storageMock;
  let messengerMock;
  let orchestrator;

  beforeEach(() => {
    storageMock = {
      getState: jest.fn(),
      saveState: jest.fn(),
    };
    messengerMock = {
      postMessage: jest.fn(),
    };
    orchestrator = new FactoryOrchestrator(storageMock, messengerMock);
  });

  it('startEpic should create a new epic in DRAFT state', async () => {
    storageMock.getState.mockResolvedValue(null);
    const state = await orchestrator.startEpic('Epic1');

    expect(state).toBe(STATES.DRAFT);
    expect(storageMock.saveState).toHaveBeenCalledWith('Epic1', STATES.DRAFT);
    expect(messengerMock.postMessage).toHaveBeenCalledWith({
      senderRole: 'Orchestrator',
      content: expect.any(String),
      recipientRole: '@BA',
      ticketId: 'Epic1',
    });
  });

  it('transitionState should update state and post message on success', async () => {
    storageMock.getState.mockResolvedValue(STATES.DRAFT);

    const state = await orchestrator.transitionState({
      epicName: 'Epic1',
      newState: STATES.READY_FOR_DESIGN,
      requestedByRole: 'BA',
      reason: 'Done with requirements',
    });

    expect(state).toBe(STATES.READY_FOR_DESIGN);
    expect(storageMock.saveState).toHaveBeenCalledWith('Epic1', STATES.READY_FOR_DESIGN);
    expect(messengerMock.postMessage).toHaveBeenCalledWith({
      senderRole: 'Orchestrator',
      content: expect.stringContaining('State updated to READY_FOR_DESIGN by BA'),
      recipientRole: null,
      ticketId: 'Epic1',
    });
  });

  it('transitionState should throw error and post message on invalid transition', async () => {
    storageMock.getState.mockResolvedValue(STATES.DRAFT);

    await expect(orchestrator.transitionState({ epicName: 'Epic1', newState: STATES.DONE, requestedByRole: 'BA' })).rejects.toThrow();

    expect(storageMock.saveState).not.toHaveBeenCalled();
    expect(messengerMock.postMessage).toHaveBeenCalledWith({
      senderRole: 'Orchestrator',
      content: expect.stringContaining('Invalid state transition'),
      recipientRole: null,
      ticketId: 'Epic1',
    });
  });

  it('startEpic should throw if epic already exists', async () => {
    storageMock.getState.mockResolvedValue(STATES.DRAFT);
    await expect(orchestrator.startEpic('Epic1')).rejects.toThrow('Epic Epic1 already exists in state DRAFT');
  });

  it('transitionState should throw if epic not found', async () => {
    storageMock.getState.mockResolvedValue(null);
    await expect(orchestrator.transitionState({ epicName: 'Epic1', newState: STATES.DONE, requestedByRole: 'BA' }))
      .rejects.toThrow('Epic Epic1 not found');
  });

  it('getStatus should return the current state', async () => {
    storageMock.getState.mockResolvedValue(STATES.IN_PROGRESS);
    const status = await orchestrator.getStatus('Epic1');
    expect(status).toBe(STATES.IN_PROGRESS);
    expect(storageMock.getState).toHaveBeenCalledWith('Epic1');
  });
});
