// eslint-disable-next-line import/no-unresolved
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// eslint-disable-next-line import/no-unresolved
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// eslint-disable-next-line import/no-unresolved
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { McpCadTools } from '../ai/McpCadTools.js';

/**
 * @module McpServerAdapter
 * @description Translates FlyCLI's McpCadTools into a standard MCP Stdio Server.
 *
 * Traceability:
 *   - Interface: ddd_interfaces.md § IMcpServer
 *   - Architecture: implementation_plan.md § [NEW] src/infrastructure/mcp/McpServer.js
 *   - CQRS: start/stop [Commands]
 */
export class McpServerAdapter {
  /**
   * @param {McpCadTools} cadTools
   * @param {object} logger
   */
  constructor(cadTools, logger = console) {
    this.cadTools = cadTools;
    this.logger = logger;

    this.server = new Server(
      { name: 'FlyCLI-CAD-Server', version: '1.2.0' },
      { capabilities: { tools: {} } },
    );

    this.setupHandlers();
  }

  /**
   * Handles the ListTools request by mapping definitions to SDK format.
   * @returns {Object}
   */
  static handleListTools() {
    const rawDefs = McpCadTools.getToolDefinitions();
    const mappedTools = rawDefs.map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.parameters,
    }));
    return { tools: mappedTools };
  }

  /**
   * Handles the CallTool request by dispatching to local CadTools.
   * @param {Object} request
   * @returns {Promise<Object>}
   */
  async handleCallTool(request) {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'render_cadquery') {
        const code = String(args?.code || '');
        const result = await this.cadTools.renderCadQuery(code);
        return {
          content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }],
        };
      }
      if (name === 'get_engine_state') {
        const state = await this.cadTools.getEngineState();
        return {
          content: [{ type: 'text', text: JSON.stringify(state) }],
        };
      }
      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error executing tool: ${err.message}` }],
        isError: true,
      };
    }
  }

  /**
   * Wires the SDK request handlers to the local methods.
   */
  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => McpServerAdapter.handleListTools());
    this.server.setRequestHandler(CallToolRequestSchema, (req) => this.handleCallTool(req));
  }

  /**
   * [COMMAND] Starts listening for MCP requests on stdio.
   * @returns {Promise<void>}
   */
  async start() {
    this.logger.info('Starting MCP Server on stdio...');
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP Server running. Waiting for agent connection...');
  }

  /**
   * [COMMAND] Stops the MCP server.
   * @returns {Promise<void>}
   */
  async stop() {
    await this.server.close();
  }
}

export default McpServerAdapter;
