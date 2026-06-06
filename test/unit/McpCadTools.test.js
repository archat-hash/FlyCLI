import { jest } from '@jest/globals';

/**
 * Unit tests for McpCadTools
 *
 * Traceability:
 *   - Requirement: ddd_interfaces.md § IpcBridge, GeometryScript
 *   - Architecture: implementation_plan.md § [NEW] src/infrastructure/ai/McpCadTools.js
 *   - Protocol: DEVELOPER.md (TDD — RED phase)
 */

const mockExecuteScript = jest.fn();
const mockGetDocumentState = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();

const mockEngine = {
  start: mockStart,
  stop: mockStop,
  executeScript: mockExecuteScript,
  getDocumentState: mockGetDocumentState,
};

const { McpCadTools } = await import('../../src/infrastructure/ai/McpCadTools.js');

const setup = () => {
  jest.clearAllMocks();
  return new McpCadTools(mockEngine);
};

// ─── render_cadquery ──────────────────────────────────────────────────────────

describe('McpCadTools.renderCadQuery — Success Path', () => {
  it('should delegate cadquery code to CadEngineProcess.executeScript()', async () => {
    const tools = setup();
    mockExecuteScript.mockResolvedValue({ executionTimeMs: 50 });

    const result = await tools.renderCadQuery('import cadquery as cq\ncq.Workplane().box(1,1,1)');

    expect(mockExecuteScript).toHaveBeenCalledTimes(1);
    expect(mockExecuteScript).toHaveBeenCalledWith('import cadquery as cq\ncq.Workplane().box(1,1,1)');
    expect(result).toEqual({ executionTimeMs: 50 });
  });
});

describe('McpCadTools.renderCadQuery — Error Path', () => {
  it('should propagate CadEngine errors to the caller', async () => {
    const tools = setup();
    mockExecuteScript.mockRejectedValue(new Error('CadEngine Error: SyntaxError'));

    await expect(tools.renderCadQuery('bad python code !!!'))
      .rejects
      .toThrow('CadEngine Error: SyntaxError');
  });

  it('should reject if code argument is empty or not a string', async () => {
    const tools = setup();

    await expect(tools.renderCadQuery('')).rejects.toThrow('GeometryScript must be a non-empty string.');
    await expect(tools.renderCadQuery(null)).rejects.toThrow('GeometryScript must be a non-empty string.');
    await expect(tools.renderCadQuery(42)).rejects.toThrow('GeometryScript must be a non-empty string.');
  });
});

// ─── getEngineState ───────────────────────────────────────────────────────────

describe('McpCadTools.getEngineState — Query (CQRS)', () => {
  it('should return EngineState from CadEngineProcess.getDocumentState()', async () => {
    const tools = setup();
    const fakeState = { objects: [{ name: 'Box', type: 'Part::Feature' }] };
    mockGetDocumentState.mockResolvedValue(fakeState);

    const state = await tools.getEngineState();

    expect(mockGetDocumentState).toHaveBeenCalledTimes(1);
    expect(state).toEqual(fakeState);
  });
});

// ─── getToolDefinitions ───────────────────────────────────────────────────────

describe('McpCadTools.getToolDefinitions — Query (CQRS, static)', () => {
  it('should return an array of tool definitions for Gemini', () => {
    const defs = McpCadTools.getToolDefinitions();

    expect(Array.isArray(defs)).toBe(true);
    expect(defs.length).toBeGreaterThan(0);
    defs.forEach((def) => {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('parameters');
    });
  });
});
