import { jest } from '@jest/globals';
import { McpFactoryTools } from '../../src/infrastructure/ai/McpFactoryTools.js';

describe('McpFactoryTools', () => {
  let tools;

  beforeEach(() => {
    tools = new McpFactoryTools();
    // Mock the internal dependencies
    tools.messenger = {
      postMessage: jest.fn().mockResolvedValue({}),
      getChatContext: jest.fn().mockResolvedValue('Chat Context Log'),
    };
    tools.orchestrator = {
      transitionState: jest.fn().mockResolvedValue('IN_PROGRESS'),
    };
  });

  it('should return tool definitions', () => {
    const defs = McpFactoryTools.getToolDefinitions();
    expect(defs.length).toBe(3);
    expect(defs[0].name).toBe('factory_post_message');
  });

  it('should post message', async () => {
    const res = await tools.postMessage({
      role: 'Developer', content: 'Hello', recipient: null, epicName: 'epic1',
    });
    expect(res.success).toBe(true);
    expect(tools.messenger.postMessage).toHaveBeenCalledWith({
      senderRole: 'Developer', content: 'Hello', recipientRole: null, ticketId: 'epic1',
    });
  });

  it('should get context', async () => {
    const res = await tools.getContext();
    expect(res.success).toBe(true);
    expect(res.context).toBe('Chat Context Log');
    expect(tools.messenger.getChatContext).toHaveBeenCalledWith(50);
  });

  it('should transition state', async () => {
    const res = await tools.transitionState({
      epicName: 'epic1', newState: 'IN_PROGRESS', role: 'BA', reason: 'Ready',
    });
    expect(res.success).toBe(true);
    expect(res.state).toBe('IN_PROGRESS');
    expect(tools.orchestrator.transitionState).toHaveBeenCalledWith({
      epicName: 'epic1', newState: 'IN_PROGRESS', requestedByRole: 'BA', reason: 'Ready',
    });
  });
});
