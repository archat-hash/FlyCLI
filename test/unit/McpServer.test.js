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
const mockToolsMethod = jest.fn();

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
      { name: 'fake_tool', description: 'fake', parameters: {} }
    ])
  }
}));

const { McpServerAdapter } = await import('../../src/infrastructure/mcp/McpServer.js');

const setup = () => {
  jest.clearAllMocks();
  // Mock CadAgent dependencies
  const mockToolsInstance = {
    renderCadQuery: jest.fn().mockResolvedValue({ success: true }),
    getEngineState: jest.fn().mockResolvedValue({ objects: [] })
  };
  return new McpServerAdapter(mockToolsInstance);
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
});
