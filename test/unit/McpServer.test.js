import { jest } from '@jest/globals';

/**
 * Unit tests for McpServer (src/infrastructure/mcp/McpServer.js)
 *
 * Traceability:
 *   - Requirement: ddd_interfaces.md § IMcpServer
 *   - Architecture: implementation_plan.md § [NEW] src/infrastructure/mcp/McpServer.js
 *   - Protocol: DEVELOPER.md (TDD — RED phase)
 */

const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockSetRequestHandler = jest.fn();

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    setRequestHandler: mockSetRequestHandler,
  })),
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

// We mock McpCadTools to avoid real IPC calls in this unit test
jest.unstable_mockModule('../../src/infrastructure/ai/McpCadTools.js', () => ({
  McpCadTools: {
    getToolDefinitions: jest.fn().mockReturnValue([
      { name: 'fake_tool', description: 'fake', parameters: {} },
    ]),
  },
}));

const { McpServerAdapter } = await import('../../src/infrastructure/mcp/McpServer.js');

const setup = () => {
  jest.clearAllMocks();
  // Mock CadAgent dependencies
  const mockToolsInstance = {
    renderCadQuery: jest.fn().mockResolvedValue({ success: true }),
    getEngineState: jest.fn().mockResolvedValue({ objects: [] }),
  };
  const mockFactoryToolsInstance = {
    postMessage: jest.fn().mockResolvedValue({ success: true }),
    getContext: jest.fn().mockResolvedValue({ context: 'hello' }),
    transitionState: jest.fn().mockResolvedValue({ success: true }),
  };
  const adapter = new McpServerAdapter(mockToolsInstance);
  adapter.factoryTools = mockFactoryToolsInstance;
  return adapter;
};

describe('McpServerAdapter', () => {
  it('should start the server and connect via stdio transport', async () => {
    const adapter = setup();
    mockConnect.mockResolvedValue();

    await adapter.start();

    // Verify MCP Server SDK methods were called
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockSetRequestHandler).toHaveBeenCalled();
  });

  it('should stop the server by calling close() on the MCP SDK Server', async () => {
    const adapter = setup();
    mockConnect.mockResolvedValue();
    mockClose.mockResolvedValue();

    await adapter.start();
    await adapter.stop();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should handle get_engine_state tool call', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'get_engine_state', arguments: {} } });
    expect(res.content[0].text).toContain('objects');
  });

  it('should handle render_cadquery tool call', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'render_cadquery', arguments: { code: 'show(cube)' } } });
    expect(res.content[0].text).toContain('Success');
  });

  it('should handle factory_post_message', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'factory_post_message', arguments: { role: 'BA' } } });
    expect(adapter.factoryTools.postMessage).toHaveBeenCalledWith({ role: 'BA' });
    expect(res.content[0].text).toContain('success');
  });

  it('should handle factory_get_context', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'factory_get_context', arguments: { epicName: 'e1' } } });
    expect(adapter.factoryTools.getContext).toHaveBeenCalledWith('e1');
    expect(res.content[0].text).toContain('hello');
  });

  it('should handle factory_transition_state', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'factory_transition_state', arguments: { newState: 'DONE' } } });
    expect(adapter.factoryTools.transitionState).toHaveBeenCalledWith({ newState: 'DONE' });
    expect(res.content[0].text).toContain('success');
  });

  it('should handle unknown tool call and errors', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[1][1];

    const res = await handler({ params: { name: 'unknown_tool', arguments: {} } });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Unknown tool');
  });

  it('should handle list tools request', async () => {
    const adapter = setup();
    await adapter.start();
    const handler = mockSetRequestHandler.mock.calls[0][1];

    const res = await handler();
    expect(res).toHaveProperty('tools');
    expect(Array.isArray(res.tools)).toBe(true);
    expect(res.tools.some((t) => t.name === 'fake_tool')).toBe(true);
  });
});
