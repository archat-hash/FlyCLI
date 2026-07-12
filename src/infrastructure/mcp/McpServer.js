// eslint-disable-next-line import/no-unresolved
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// eslint-disable-next-line import/no-unresolved
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// eslint-disable-next-line import/no-unresolved
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { McpCadTools } from '../ai/McpCadTools.js';
import { McpFactoryTools } from '../ai/McpFactoryTools.js';

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
    this.factoryTools = new McpFactoryTools();
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
    const cadDefs = McpCadTools.getToolDefinitions();
    const factoryDefs = McpFactoryTools.getToolDefinitions();
    const allDefs = [...cadDefs, ...factoryDefs];

    const mappedTools = allDefs.map((def) => ({
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
      const handlers = {
        render_cadquery: () => this.handleRenderCadQuery(args),
        get_engine_state: () => this.handleGetEngineState(),
        factory_post_message: () => this.handleFactoryPostMessage(args),
        factory_get_context: () => this.handleFactoryGetContext(args),
        factory_transition_state: () => this.handleFactoryTransitionState(args),
      };

      if (handlers[name]) return await handlers[name]();
      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error executing tool: ${err.message}` }],
        isError: true,
      };
    }
  }

  async handleRenderCadQuery(args) {
    const code = String(args?.code || '');
    const result = await this.cadTools.renderCadQuery(code);
    return { content: [{ type: 'text', text: `Success: ${JSON.stringify(result)}` }] };
  }

  async handleGetEngineState() {
    const state = await this.cadTools.getEngineState();
    return { content: [{ type: 'text', text: JSON.stringify(state) }] };
  }

  async handleFactoryPostMessage(args) {
    const result = await this.factoryTools.postMessage(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }

  async handleFactoryGetContext(args) {
    const result = await this.factoryTools.getContext(args.epicName);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }

  async handleFactoryTransitionState(args) {
    const result = await this.factoryTools.transitionState(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
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
