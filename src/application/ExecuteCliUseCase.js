import CliParser from '../domain/CliParser.js';

const delay = (ms) => new Promise((resolve) => {
  setTimeout(() => resolve(), ms);
});

export default class ExecuteCliUseCase {
  constructor(flightController) {
    this.controller = flightController;
    this.prompt = '# ';
    this.lineDelayMs = 5;
    this.profileSwitchDelayMs = 100;
  }

  async execute(command) {
    let globalTimeout = null;

    const executeInner = async () => {
      // 1. Connect
      await this.controller.connect();

      // 2. Ensuring we are ready (wait for prompt event if not already at prompt)
      if (!this.controller.buffer.endsWith(this.prompt)) {
        await this.controller.waitFor(this.prompt);
      }

      // 3. Hardware readiness delay
      const waitTime = command.toLowerCase().startsWith('profile')
        ? this.profileSwitchDelayMs
        : this.lineDelayMs;
      await delay(waitTime);

      // 4. Send command
      this.controller.clearBuffer(); // Clear previous session noise
      await this.controller.sendRaw(`${command}\n`);

      // 5. Handle Reboot Commands
      const rebootCommands = ['save', 'reboot', 'exit'];
      if (rebootCommands.includes(command.toLowerCase())) {
        try {
          // Wait for disconnect as proof of reboot (timeout 3s as per plan)
          await this.controller.waitForDisconnect(3000);
          return 'Rebooting...';
        } catch (e) {
          throw new Error(`Reboot failed: ${e.message}`);
        }
      }

      // 5. Wait for the NEXT prompt event
      await this.controller.waitFor(this.prompt);

      // Debounce for final line arrival
      await delay(300);

      const parsed = CliParser.parse(this.controller.buffer);

      const outputData = parsed
        .filter((p) => p.type === 'DATA' || p.type === 'ECHO' || p.type === 'HEADER')
        .map((p) => p.content);

      // Filter out command echo (it's always the first line if present)
      if (outputData.length > 0 && outputData[0].toLowerCase() === command.toLowerCase()) {
        outputData.shift();
      }

      return outputData.length === 0 ? '' : outputData.join('\n');
    };

    try {
      const timeoutPromise = new Promise((_, reject) => {
        globalTimeout = setTimeout(() => {
          reject(new Error(`Timeout waiting for CLI response: ${command}`));
        }, 15000);
      });

      return await Promise.race([executeInner(), timeoutPromise]);
    } finally {
      if (globalTimeout) clearTimeout(globalTimeout);
      await this.controller.disconnect();
    }
  }
}
