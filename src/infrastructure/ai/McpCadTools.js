/**
 * @module McpCadTools
 * @description Provides Gemini-facing MCP tool definitions for CAD interaction.
 *
 * Traceability:
 *   - Interface: ddd_interfaces.md § ICadEngineProcess (IpcBridge contract)
 *   - Architecture: implementation_plan.md § [NEW] src/infrastructure/ai/McpCadTools.js
 *   - Domain terms: GeometryScript, EngineState, IpcBridge (ddd_interfaces.md)
 *   - CQRS: renderCadQuery is a Command; getEngineState / getToolDefinitions are Queries.
 */

/**
 * Tool definition schema for Gemini function-calling API.
 * @typedef {Object} ToolDefinition
 * @property {string} name
 * @property {string} description
 * @property {Object} parameters
 */

const RENDER_TOOL = {
  name: 'render_cadquery',
  description:
    'Executes a CadQuery (Python) GeometryScript inside the running FreeCAD window. '
    + 'Call this tool whenever you have generated 3D model code to display or update.',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Valid CadQuery Python code. Must not be empty.',
      },
    },
    required: ['code'],
  },
};

const STATE_TOOL = {
  name: 'get_engine_state',
  description:
    'Returns the current EngineState: the list of objects in the open FreeCAD document. '
    + 'Use this to understand what is already rendered before making changes.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const TOOL_DEFINITIONS = [RENDER_TOOL, STATE_TOOL];

/**
 * Validates that a GeometryScript is a non-empty string.
 * @param {unknown} code
 * @throws {Error} if code is not a non-empty string
 */
function assertValidScript(code) {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('GeometryScript must be a non-empty string.');
  }
}

/**
 * Provides Gemini-facing MCP tool definitions and delegates execution to CadEngineProcess.
 * @implements {ICadToolsProvider}
 */
export class McpCadTools {
  /**
   * @param {import('../cad/CadEngineProcess.js').CadEngineProcess} engine
   * @param {Function} [lazyStart] - Optional async function to lazily start the engine
   */
  constructor(engine, lazyStart) {
    this.engine = engine;
    this.lazyStart = lazyStart || (async () => {});
  }

  /**
   * [COMMAND] Sends a GeometryScript to FreeCAD for execution via the IpcBridge.
   * Mutates CAD document state; returns execution metadata.
   *
   * @param {string} code - Python/CadQuery GeometryScript
   * @returns {Promise<Object>} Execution result from CadEngineProcess
   * @throws {Error} If code is invalid or engine returns an error
   */
  async renderCadQuery(code) {
    assertValidScript(code);
    await this.lazyStart();
    return this.engine.executeScript(code);
  }

  /**
   * [QUERY] Reads the current EngineState from the open FreeCAD document.
   * Returns data; produces no side effects.
   *
   * @returns {Promise<Object>} Serialized EngineState (object tree)
   */
  async getEngineState() {
    await this.lazyStart();
    return this.engine.getDocumentState();
  }

  /**
   * [QUERY] Returns the list of Gemini tool definitions for CAD interaction.
   * Static — returns module-level constants, no instance state required.
   *
   * @returns {ToolDefinition[]}
   */
  static getToolDefinitions() {
    return TOOL_DEFINITIONS;
  }
}

export default McpCadTools;
