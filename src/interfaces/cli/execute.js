import fs from 'fs';
import SerialFlightController from '../../infrastructure/SerialFlightController.js';
import ExecuteCliUseCase from '../../application/commands/ExecuteCliUseCase.js';
import ConsoleLogger from '../../infrastructure/Logger.js';

/**
 * @param {string|string[]} output
 * @param {{ json: boolean, cmd: string|string[] }} options
 */
function printOutput(output, { cmd, json }) {
  if (json) {
    process.stdout.write(`${JSON.stringify({ command: cmd, output })}\n`);
  } else if (Array.isArray(output)) {
    output.forEach((line, index) => {
      if (line) process.stdout.write(`[${index + 1}] ${line}\n`);
    });
  } else {
    process.stdout.write(`${output}\n`);
  }
}

/**
 * Reads commands from a file.
 * @param {string} filePath
 * @returns {string[]}
 */
function readCommandsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.split(/\r?\n/).filter((line) => line.trim() !== '' && !line.startsWith('#'));
}

/**
 * Prepares commands from input or file.
 * @param {string} cmd
 * @param {object} options
 * @returns {string|string[]|null}
 */
function resolveCommands(cmd, options) {
  if (options.file) {
    return readCommandsFromFile(options.file);
  }
  return cmd;
}

/**
 * Validates commands existence.
 * @param {string|string[]} commands
 * @returns {boolean}
 */
function hasCommands(commands) {
  return commands && (!Array.isArray(commands) || commands.length > 0);
}

/**
 * Executes a CLI command on the Betaflight controller.
 * @param {string} port
 * @param {string} baudRate
 * @param {string} cmd
 * @param {Object} options
 */
export default async function executeCommand(port, baudRate, cmd, options) {
  const logger = new ConsoleLogger();
  const controller = new SerialFlightController(port, parseInt(baudRate, 10), logger);
  const useCase = new ExecuteCliUseCase(controller, logger);

  const commands = resolveCommands(cmd, options);

  if (!hasCommands(commands)) {
    process.stderr.write('Error: No command provided.\n');
    return;
  }

  try {
    const output = await useCase.execute(commands);
    printOutput(output, { cmd: commands, json: options.json });
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    await controller.disconnect();
  }
}
