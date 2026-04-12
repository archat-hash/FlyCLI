import SerialFlightController from '../infrastructure/SerialFlightController.js';
import ExecuteCliUseCase from '../application/ExecuteCliUseCase.js';

/**
 * Executes a CLI command on the Betaflight controller.
 * @param {string} port
 * @param {string} baudRate
 * @param {string} cmd
 * @param {Object} options
 */
export default async function executeCommand(port, baudRate, cmd, options) {
  const controller = new SerialFlightController(port, parseInt(baudRate, 10));
  const useCase = new ExecuteCliUseCase(controller);

  try {
    const output = await useCase.execute(cmd);

    if (options.json) {
      console.log(JSON.stringify({ command: cmd, output }));
    } else {
      console.log(output);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    await controller.disconnect();
  }
}
