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

  async execute(command) {
    let globalTimeout = null;

    const executeInner = async () => {
      // 1. Connect
      await this.#controller.connect();

      // 2. Ensuring we are ready (wait for prompt event if not already at prompt)
      if (!this.#controller.buffer.endsWith(this.#prompt)) {
        try {
          await this.#controller.waitFor(this.#prompt, 500); // Wait briefly just in case
        } catch (e) {
          // Ignore timeout, FC is likely ready anyway
        }
      }

      // 3. Hardware readiness delay
      const waitTime = command.toLowerCase().startsWith('profile')
        ? this.#profileSwitchDelayMs
        : this.#lineDelayMs;
      await delay(waitTime);

      // 4. Send command
      await this.#controller.clearBuffer(); // Clear previous session noise
      await this.#controller.sendRaw(`${command}\n`);

      // 5. Handle Reboot and DFU Commands
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

      // 6. Wait for the NEXT prompt event
      try {
        await this.#controller.waitFor(this.#prompt, 1500); // reduced timeout to 1.5s
      } catch (err) {
        if (err.message.includes('Connection lost')) {
          throw err;
        }
        // If it's a timeout, it just means the FC didn't output a prompt "# ".
        // We will process whatever is in the buffer!
      }

      // Debounce for final line arrival
      await delay(100);

      const parsed = CliParser.parse(this.#controller.buffer);

      const outputData = parsed
        .filter((p) => p.type === 'DATA' || p.type === 'ECHO' || p.type === 'HEADER')
        .map((p) => p.content);

      // Filter out command echo (exact match required)
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
