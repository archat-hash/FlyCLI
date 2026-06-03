import { EnvironmentManager } from '../../infrastructure/cad/EnvironmentManager.js';
import { CadEngineProcess } from '../../infrastructure/cad/CadEngineProcess.js';
import { McpCadTools } from '../../infrastructure/ai/McpCadTools.js';
import ConsoleLogger from '../../infrastructure/Logger.js';

/**
 * @module CadAgent
 * @description Orchestrates the interactive CAD modeling session.
 *   Acts as the top-level "CadAgent" from the DDD Ubiquitous Language:
 *   User (AI) CadAgent IpcBridge CadEngineProcess (FreeCAD)
 *
 * Traceability:
 *   - Domain: ddd_interfaces.md § CadAgent
 *   - Architecture: implementation_plan.md § [MODIFY] src/interfaces/cli/cad.js
 *   - Lifecycle: implementation_plan.md § Lifecycle (Feedback Loop)
 *   - DEVELOPER.md: CQRS — startSession() is a Command (launches FreeCAD, runs loop)
 */

/**
 * Bootstraps the CadAgent infrastructure dependencies.
 * @param {object} logger
 * @returns {{ env: EnvironmentManager, engine: CadEngineProcess, tools: McpCadTools }}
 */
function buildDependencies(logger) {
  const env = new EnvironmentManager(logger);
  const engine = new CadEngineProcess(logger);
  const tools = new McpCadTools(engine);
  return { env, engine, tools };
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
 * @param {string} prompt
 */
function printBanner(prompt) {
  process.stdout.write('\n🚀 FlyCLI CAD Agent — Interactive 3D Modeling\n');
  process.stdout.write(`${'-'.repeat(50)}\n`);
  process.stdout.write(`📝 Initial request: "${prompt}"\n`);
  process.stdout.write('💡 FreeCAD is starting… Please wait.\n\n');
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
 * Builds a placeholder GeometryScript for MVP pipeline validation.
 * Phase 5 will replace this with a real Gemini AI call.
 * @param {string} prompt
 * @returns {string}
 */
function buildPlaceholderScript(prompt) {
  return [
    'import cadquery as cq',
    `# User request: ${prompt}`,
    "result = cq.Workplane('XY').box(50, 30, 20)",
    'show_object(result)',
  ].join('\n');
}

/**
 * [COMMAND] Runs a single CAD request: renders the geometry and reports result.
 * Full interactive loop with Gemini AI will be wired in Phase 5.
 *
 * @param {McpCadTools} tools
 * @param {string} prompt - User's natural-language request
 * @returns {Promise<void>}
 */
async function runCadRequest(tools, prompt) {
  const script = buildPlaceholderScript(prompt);
  process.stdout.write('⚙️  Executing geometry script in FreeCAD…\n');
  const result = await tools.renderCadQuery(script);
  process.stdout.write(`✅ Rendered successfully (${result?.executionTimeMs ?? '?'}ms)\n`);
  process.stdout.write('👁️  Check the FreeCAD window to see your model.\n');
}

/**
 * [COMMAND] Main CLI handler for `flycli cad <prompt>`.
 * Orchestrates EnvironmentManager → CadEngineProcess → McpCadTools.
 * Guarantees engine.stop() is always called (graceful cleanup).
 *
 * @param {string} prompt - Natural-language description of the desired 3D model
 * @returns {Promise<void>}
 */
export default async function cadCommand(prompt) {
  const logger = new ConsoleLogger();
  const { env, engine, tools } = buildDependencies(logger);

  printBanner(prompt);

  try {
    await startEngine(env, engine);
    await runCadRequest(tools, prompt);
  } catch (err) {
    printError(err);
  } finally {
    await engine.stop();
  }
}
