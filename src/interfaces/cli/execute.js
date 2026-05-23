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
    console.log(JSON.stringify({ command: cmd, output }));
  } else if (Array.isArray(output)) {
    output.forEach((line, index) => {
      if (line) console.log(`[${index + 1}] ${line}`);
    });
  } else {
    console.log(output);
  }
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

  let commands = cmd;
  if (options.file) {
    try {
      const fileContent = fs.readFileSync(options.file, 'utf8');
      commands = fileContent.split(/\r?\n/).filter((line) => line.trim() !== '' && !line.startsWith('#'));
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      return;
    }
  }

  if (!commands || (Array.isArray(commands) && commands.length === 0)) {
    console.error('Error: No command provided and no file specified.');
    return;
  }

  try {
    const output = await useCase.execute(commands);
    printOutput(output, { cmd: commands, json: options.json });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    await controller.disconnect();
  }
}
