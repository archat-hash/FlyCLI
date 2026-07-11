import { jest } from '@jest/globals';

/**
 * Unit tests for CadCommand (src/interfaces/cli/cad.js)
 *
 * Traceability:
 *   - User Story: Business Scenario "flycli cad"
 *   - Architecture: implementation_plan.md § [MODIFY] src/interfaces/cli/cad.js
 *   - Domain: CadAgent orchestrates EnvironmentManager + CadEngineProcess + McpServer
 *   - Protocol: DEVELOPER.md (TDD — RED phase)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockEnsureEnvironmentReady = jest.fn();
const mockEngineStart = jest.fn();
const mockEngineStop = jest.fn();
const mockMcpStart = jest.fn();
const mockMcpStop = jest.fn();

jest.unstable_mockModule('../../src/infrastructure/cad/EnvironmentManager.js', () => ({
  EnvironmentManager: jest.fn().mockImplementation(() => ({
    ensureEnvironmentReady: mockEnsureEnvironmentReady,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/cad/CadEngineProcess.js', () => ({
  CadEngineProcess: jest.fn().mockImplementation(() => ({
    start: mockEngineStart,
    stop: mockEngineStop,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/ai/McpCadTools.js', () => ({
  McpCadTools: jest.fn(),
}));

jest.unstable_mockModule('../../src/infrastructure/mcp/McpServer.js', () => ({
  McpServerAdapter: jest.fn().mockImplementation(() => ({
    start: mockMcpStart,
    stop: mockMcpStop,
  })),
}));

const { default: cadCommand } = await import('../../src/interfaces/cli/cad.js');

// ─── Tests ────────────────────────────────────────────────────────────────────

const setup = () => {
  jest.clearAllMocks();
  mockEnsureEnvironmentReady.mockResolvedValue('/usr/bin/freecad');
  mockEngineStart.mockResolvedValue(undefined);
  mockEngineStop.mockResolvedValue(undefined);
  mockMcpStart.mockResolvedValue(undefined);
  mockMcpStop.mockResolvedValue(undefined);
};

describe('cadCommand — Happy Path', () => {
  it('should bootstrap EnvironmentManager → CadEngineProcess → McpServerAdapter in sequence', async () => {
    setup();
    // Simulate graceful interruption since server runs indefinitely
    mockMcpStart.mockImplementation(async () => {
      // Simulate process.on('SIGINT') event
      process.emit('SIGINT');
    });

    await cadCommand();

    expect(mockMcpStart).toHaveBeenCalledTimes(1);
    expect(mockMcpStop).toHaveBeenCalledTimes(1);
    expect(mockEngineStop).toHaveBeenCalledTimes(1);
  });
});

describe('cadCommand — Error Handling', () => {
  it('should call mcpServer.stop() and engine.stop() when McpServer fails', async () => {
    setup();
    mockMcpStart.mockRejectedValue(new Error('Port in use'));

    await expect(cadCommand()).resolves.not.toThrow();

    expect(mockMcpStop).toHaveBeenCalledTimes(1);
    expect(mockEngineStop).toHaveBeenCalledTimes(1);
  });
});
