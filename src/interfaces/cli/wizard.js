import RxCalibrationMachine from '../../application/wizards/rxCalibrationMachine.js';
import MspProtocol from '../../infrastructure/MspProtocol.js';
import TerminalIndicator from '../ui/terminalIndicator.js';

/**
 * Writes the wizard result to stdout (JSON) or stderr (human text).
 * @param {object} result
 * @param {boolean} isJson
 */
function outputResult(result, isJson) {
  if (isJson) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  const icon = result.status === 'success' ? '✔' : '✘';
  process.stderr.write(`\n  ${icon} RC Wizard finished with status: ${result.status}\n`);
  if (result.error) {
    process.stderr.write(`  Error: ${result.error}\n`);
    return;
  }
  Object.entries(result.channels).forEach(([axis, stats]) => {
    process.stderr.write(`  ${axis.padEnd(10)} min=${stats.min}  max=${stats.max}\n`);
  });
}

/**
 * Writes a fatal error and exits.
 * @param {Error} err
 * @param {boolean} isJson
 */
function handleFatalError(err, isJson) {
  const errResult = { status: 'error', error: err.message };
  if (isJson) {
    process.stdout.write(`${JSON.stringify(errResult)}\n`);
  } else {
    process.stderr.write(`\n  ✘ Fatal error: ${err.message}\n`);
  }
  process.exit(1);
}

/**
 * Handler for `flycli wizard <type> <port> [baud]`
 *
 * - Visual progress bars go to process.stderr (human-readable).
 * - Final JSON result goes to process.stdout (machine-readable for AI Agents).
 *
 * @param {string} type - Wizard type (currently only 'rx')
 * @param {string} port - Serial port path
 * @param {string} baud - Baud rate as string
 * @param {object} options - Commander options
 */
export default async function wizardCommand(type, port, baud, options) {
  if (type !== 'rx') {
    const err = { status: 'error', error: `Unknown wizard type: "${type}". Available: rx` };
    outputResult(err, options.json);
    process.exit(1);
  }

  const baudRate = parseInt(baud, 10);

  if (!options.json) {
    process.stderr.write('\n  ✦ FlyCLI Interactive RC Wizard\n');
    process.stderr.write(`  Port: ${port} @ ${baudRate} baud\n`);
    process.stderr.write('  Connecting to flight controller...\n\n');
  }

  try {
    const msp = new MspProtocol(port, baudRate);
    const ui = new TerminalIndicator();
    const machine = new RxCalibrationMachine(msp, ui);
    const result = await machine.run();
    outputResult(result, options.json);
    process.exit(result.status === 'success' ? 0 : 1);
  } catch (err) {
    handleFatalError(err, options.json);
  }
}
