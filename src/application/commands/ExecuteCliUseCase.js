import CliParser from '../../domain/CliParser.js';
import TimeoutError from '../../domain/errors/TimeoutError.js';
import DeviceError from '../../domain/errors/DeviceError.js';
import ConnectionError from '../../domain/errors/ConnectionError.js';

const delay = (ms) => new Promise((resolve) => { setTimeout(() => resolve(), ms); });

const REBOOT_COMMANDS = ['save', 'reboot', 'exit'];
const PROMPT = '# ';
const LINE_DELAY_MS = 5;
const PROFILE_DELAY_MS = 100;
const GLOBAL_TIMEOUT_MS = 15000;
const PROMPT_TIMEOUT_MS = 1500;
const POST_COMMAND_DELAY_MS = 100;
const DISCONNECT_TIMEOUT_MS = 5000;

/**
 * Command to execute a CLI command on the flight controller.
 */
export default class ExecuteCliUseCase {
  #controller;

  #logger;

  /**
   * @param {object} flightController
   * @param {object} logger
   */
  constructor(flightController, logger) {
    this.#controller = flightController;
    this.#logger = logger;
  }

  /**
   * @param {string} command
   * @returns {boolean}
   */
  static #isDisconnectingCommand(command) {
    const cmd = command.trim().toLowerCase();
    return REBOOT_COMMANDS.includes(cmd);
  }

  /**
   * @param {string} command
   * @returns {string}
   */
  static #resolveDisconnectMarker() {
    return '[REBOOT_INITIATED]';
  }

  /**
   * @param {string} command
   * @returns {Promise<string>}
   */
  async #handleDisconnectingCommand(command) {
    try {
      await this.#controller.waitForDisconnect(DISCONNECT_TIMEOUT_MS);
      await this.#controller.reset();
      return ExecuteCliUseCase.#resolveDisconnectMarker(command);
    } catch (e) {
      throw new DeviceError(`Device did not gracefully disconnect after command. Error: ${e.message}`);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async #waitForPrompt() {
    try {
      await this.#controller.waitFor(PROMPT, PROMPT_TIMEOUT_MS);
    } catch (err) {
      if (err.message.includes('Connection lost')) {
        throw new ConnectionError(err.message);
      }
    }
  }

  /**
   * @param {string} command
   * @returns {string}
   */
  #parseOutput(command) {
    const parsed = CliParser.parse(this.#controller.buffer);
    const outputData = parsed
      .filter((p) => p.type === 'DATA' || p.type === 'ECHO' || p.type === 'HEADER')
      .map((p) => p.content);

    const firstLine = outputData[0]?.trim().toLowerCase();
    const isEchoLine = outputData.length > 0 && firstLine === command.trim().toLowerCase();
    if (isEchoLine) {
      outputData.shift();
    }

    return outputData.length === 0 ? '' : outputData.join('\n');
  }

  /**
   * @param {string} command
   * @returns {Promise<string>}
   */
  async #executeInner(command) {
    await this.#controller.connect();

    const waitTime = command.toLowerCase().startsWith('profile') ? PROFILE_DELAY_MS : LINE_DELAY_MS;
    await delay(waitTime);

    await this.#controller.clearBuffer();
    await this.#controller.sendRaw(`${command}\n`);

    if (ExecuteCliUseCase.#isDisconnectingCommand(command)) {
      return this.#handleDisconnectingCommand(command);
    }

    await this.#waitForPrompt();
    await delay(POST_COMMAND_DELAY_MS);
    return this.#parseOutput(command);
  }

  /**
   * Executes a CLI command and returns the response.
   * @param {string} command - The CLI command to execute.
   * @returns {Promise<string>} The output of the command.
   * @throws {TimeoutError} If the device fails to respond within the timeout.
   * @throws {DeviceError} If the device disconnects unexpectedly.
   * @throws {ConnectionError} If the connection is lost.
   */
  async execute(command) {
    let globalTimeout = null;

    const timeoutPromise = new Promise((_, reject) => {
      globalTimeout = setTimeout(() => {
        reject(new TimeoutError(`Timeout waiting for CLI response: ${command}`));
      }, GLOBAL_TIMEOUT_MS);
      globalTimeout.unref();
    });

    try {
      this.#logger.debug(`Executing CLI command: ${command}`);
      return await Promise.race([this.#executeInner(command), timeoutPromise]);
    } finally {
      if (globalTimeout) clearTimeout(globalTimeout);
      await this.#controller.disconnect();
    }
  }
}
