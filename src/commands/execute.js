import SerialFlightController from '../infrastructure/SerialFlightController.js';
import ExecuteCliUseCase from '../application/commands/ExecuteCliUseCase.js';
import ConsoleLogger from '../infrastructure/Logger.js';

/**
 * @param {string} output
 * @param {{ json: boolean }} options
 */
function printOutput(output, { cmd, json }) {
  if (json) {
    console.log(JSON.stringify({ command: cmd, output }));
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

  try {
    const output = await useCase.execute(cmd);
    printOutput(output, { cmd, json: options.json });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    await controller.disconnect();
  }
}
