import fs from 'fs';
import SerialFlightController from '../../src/infrastructure/SerialFlightController.js';
import ExecuteCliUseCase from '../../src/application/commands/ExecuteCliUseCase.js';
import PortScanner from '../../src/infrastructure/PortScanner.js';
import ConsoleLogger from '../../src/infrastructure/Logger.js';

describe('Integration Test: Connection Stability', () => {
  it('should detect the exact failure point', async () => {
    const scanner = new PortScanner();
    const ports = await scanner.listPorts();
    const device = ports.find((p) => p.isLikelyBetaflight);
    const port = process.env.TEST_PORT || (device ? device.path : null);

    if (!port || !fs.existsSync(port)) {
      console.warn(`[SKIPPED] Integration test skipped: Physical device not found at ${port || 'any port'}`);
      return;
    }

    const logger = new ConsoleLogger();
    const controller = new SerialFlightController(port, 115200, logger);
    const useCase = new ExecuteCliUseCase(controller, logger);

    console.log('--- Starting connection test ---');
    await controller.connect();
    console.log('--- Connection established ---');

    // Check if we receive any data
    let dataReceived = false;
    controller.onData(() => { dataReceived = true; });

    await new Promise((r) => { setTimeout(r, 2000); });
    console.log('--- Data received during wait:', dataReceived);

    // Now execute Use Case
    const result = await useCase.execute('version');
    console.log('--- Result:', result);

    expect(result).toContain('Betaflight / STM32F411');
    await controller.disconnect();
  }, 40000);
});
