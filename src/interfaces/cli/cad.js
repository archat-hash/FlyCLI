import { EnvironmentManager } from '../../infrastructure/cad/EnvironmentManager.js';
import { CadEngineProcess } from '../../infrastructure/cad/CadEngineProcess.js';
import { McpCadTools } from '../../infrastructure/ai/McpCadTools.js';
import { McpServerAdapter } from '../../infrastructure/mcp/McpServer.js';
import ConsoleLogger from '../../infrastructure/Logger.js';

/**
 * @module CadAgent
 * @description Orchestrates the interactive CAD modeling session.
 *   Acts as the top-level "CadAgent" from the DDD Ubiquitous Language:
 *   External Agent (MCP) <-> CadAgent <-> IpcBridge <-> CadEngineProcess (FreeCAD)
 *
 * Traceability:
 *   - Domain: ddd_interfaces.md § CadAgent
 *   - Architecture: implementation_plan.md § [MODIFY] src/interfaces/cli/cad.js
 *   - CQRS: startSession() is a Command (launches FreeCAD, starts MCP Server)
 */

/**
 * Bootstraps the CadAgent infrastructure dependencies.
 * @param {object} logger
 * @returns {{ env: EnvironmentManager, engine: CadEngineProcess, mcpServer: McpServerAdapter }}
 */
function buildDependencies(logger) {
  const env = new EnvironmentManager(logger);
  const engine = new CadEngineProcess(logger);
  const tools = new McpCadTools(engine);
  const mcpServer = new McpServerAdapter(tools, logger);
  return { env, engine, mcpServer };
}

/**
 * Resolves the FreeCAD executable and starts the CadEngine process.
 * @param {EnvironmentManager} env
 * @param {CadEngineProcess} engine
 * @returns {Promise<void>}
 */
async function startEngine(env, engine) {
  const executablePath = await env.ensureEnvironmentReady();
  await engine.start(executablePath);
}

/**
 * Prints the CadAgent welcome banner to stdout.
 */
function printBanner() {
  process.stderr.write('\n🚀 FlyCLI CAD Agent — Model Context Protocol (MCP) Server\n');
  process.stderr.write(`${'-'.repeat(50)}\n`);
  process.stderr.write('💡 FreeCAD is starting… Please wait.\n');
}

/**
 * Prints a user-friendly error message to stderr.
 * @param {Error} err
 */
function printError(err) {
  process.stderr.write(`\n❌ CAD Agent Error: ${err.message}\n`);
  process.stderr.write('💡 Tip: Make sure FreeCAD is installed or set the FREECAD_PATH env var.\n');
}

/**
 * Helper to gracefully stop services.
 * @param {McpServerAdapter} mcpServer
 * @param {CadEngineProcess} engine
 * @param {Function} resolveExit
 */
async function stopServices(mcpServer, engine, resolveExit) {
  try {
    await mcpServer.stop();
  } finally {
    await engine.stop();
    if (resolveExit) resolveExit();
  }
}

/**
 * [COMMAND] Main CLI handler for `flycli cad`.
 * Orchestrates EnvironmentManager → CadEngineProcess → McpServerAdapter.
 * Guarantees engine.stop() is always called (graceful cleanup).
 *
 * @returns {Promise<void>}
 */
export default async function cadCommand() {
  const logger = new ConsoleLogger();
  const { env, engine, mcpServer } = buildDependencies(logger);

  printBanner();

  let isStopping = false;
  let resolveExit;
  const exitPromise = new Promise((resolve) => { resolveExit = resolve; });

  const cleanup = async () => {
    if (isStopping) return;
    isStopping = true;
    await stopServices(mcpServer, engine, resolveExit);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await startEngine(env, engine);
    /*
     * Note: Start the MCP Server on stdio.
     * The Promise from mcpServer.start() will resolve when the server is ready,
     * but the node process will stay alive because of the stdio event listeners.
     */
    await mcpServer.start();

    await exitPromise;
  } catch (err) {
    if (!isStopping) {
      printError(err);
    }
  } finally {
    await cleanup();
  }
}
