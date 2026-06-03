import { jest } from '@jest/globals';

/**
 * Unit tests for CadCommand (src/interfaces/cli/cad.js)
 *
 * Traceability:
 *   - User Story: Business Scenario "flycli cad <prompt>"
 *   - Architecture: implementation_plan.md § [MODIFY] src/interfaces/cli/cad.js
 *   - Domain: CadAgent orchestrates EnvironmentManager + CadEngineProcess + McpCadTools
 *   - Protocol: DEVELOPER.md (TDD — RED phase)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockEnsureEnvironmentReady = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockExecuteScript = jest.fn();
const mockGetDocumentState = jest.fn();
const mockRenderCadQuery = jest.fn();

jest.unstable_mockModule('../../src/infrastructure/cad/EnvironmentManager.js', () => ({
  EnvironmentManager: jest.fn().mockImplementation(() => ({
    ensureEnvironmentReady: mockEnsureEnvironmentReady,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/cad/CadEngineProcess.js', () => ({
  CadEngineProcess: jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
    executeScript: mockExecuteScript,
    getDocumentState: mockGetDocumentState,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/ai/McpCadTools.js', () => ({
  McpCadTools: jest.fn().mockImplementation(() => ({
    renderCadQuery: mockRenderCadQuery,
    getEngineState: jest.fn(),
    getToolDefinitions: jest.fn().mockReturnValue([]),
  })),
}));

const { default: cadCommand } = await import('../../src/interfaces/cli/cad.js');

// ─── Tests ────────────────────────────────────────────────────────────────────

const setup = () => {
  jest.clearAllMocks();
  mockEnsureEnvironmentReady.mockResolvedValue('/usr/bin/freecad');
  mockStart.mockResolvedValue(undefined);
  mockStop.mockResolvedValue(undefined);
};

describe('cadCommand — Happy Path', () => {
  it('should bootstrap EnvironmentManager → CadEngineProcess → McpCadTools in sequence', async () => {
    setup();
    mockRenderCadQuery.mockResolvedValue({ executionTimeMs: 100 });

    await cadCommand('draw a box 50x50');

    expect(mockEnsureEnvironmentReady).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith('/usr/bin/freecad');
    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});

describe('cadCommand — Error Handling', () => {
  it('should call engine.stop() even when EnvironmentManager fails', async () => {
    setup();
    mockEnsureEnvironmentReady.mockRejectedValue(new Error('FreeCAD not found'));

    // Should not throw — graceful exit
    await expect(cadCommand('draw something')).resolves.not.toThrow();

    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});
