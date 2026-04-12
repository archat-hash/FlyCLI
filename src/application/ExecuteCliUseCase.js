import CliParser from '../domain/CliParser.js';

const delay = (ms) => new Promise((resolve) => {
  setTimeout(() => resolve(), ms);
});

export default class ExecuteCliUseCase {
  #controller;

  #prompt;

  #lineDelayMs;

  #profileSwitchDelayMs;

  constructor(flightController) {
    this.#controller = flightController;
    this.#prompt = '# ';
    this.#lineDelayMs = 5;
    this.#profileSwitchDelayMs = 100;
  }

  /**
   * Executes a CLI command and returns the response.
   * @param {string} command - The CLI command to execute.
   * @returns {Promise<string>} The output of the command.
   * @throws {Error} If the device fails to respond or disconnects unexpectedly.
   */
  async execute(command) {
    let globalTimeout = null;

    const executeInner = async () => {
      await this.#controller.connect();

      const waitTime = command.toLowerCase().startsWith('profile')
        ? this.#profileSwitchDelayMs
        : this.#lineDelayMs;
      await delay(waitTime);

      await this.#controller.clearBuffer();
      await this.#controller.sendRaw(`${command}\n`);

      const rebootCommands = ['save', 'reboot', 'exit'];
      const dfuCommands = ['bl', 'defaults'];
      const isReboot = rebootCommands.includes(command.trim().toLowerCase());
      const isDfu = dfuCommands.includes(command.trim().toLowerCase());

      if (isReboot || isDfu) {
        try {
          await this.#controller.waitForDisconnect(5000);
          await this.#controller.reset();
          return isDfu ? '[DFU_ENTERED]' : '[REBOOT_INITIATED]';
        } catch (e) {
          throw new Error(`Device did not gracefully disconnect after command. Error: ${e.message}`);
        }
      }

      try {
        await this.#controller.waitFor(this.#prompt, 1500);
      } catch (err) {
        if (err.message.includes('Connection lost')) {
          throw err;
        }
      }

      await delay(100);

      const parsed = CliParser.parse(this.#controller.buffer);

      const outputData = parsed
        .filter((p) => p.type === 'DATA' || p.type === 'ECHO' || p.type === 'HEADER')
        .map((p) => p.content);

      if (outputData.length > 0) {
        const firstLine = outputData[0].trim().toLowerCase();
        const cmd = command.trim().toLowerCase();
        if (firstLine === cmd) {
          outputData.shift();
        }
      }

      return outputData.length === 0 ? '' : outputData.join('\n');
    };

    try {
      const timeoutPromise = new Promise((_, reject) => {
        globalTimeout = setTimeout(() => {
          reject(new Error(`Timeout waiting for CLI response: ${command}`));
        }, 15000);
        globalTimeout.unref();
      });

      return await Promise.race([executeInner(), timeoutPromise]);
    } finally {
      if (globalTimeout) clearTimeout(globalTimeout);
      await this.#controller.disconnect();
    }
  }
}
