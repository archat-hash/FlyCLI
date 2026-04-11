import SerialFlightController from '../../src/infrastructure/SerialFlightController.js';
import ExecuteCliUseCase from '../../src/application/ExecuteCliUseCase.js';
import CliParser from '../../src/domain/CliParser.js';

describe('Integration Test: Connection Stability', () => {
  it('should detect the exact failure point', async () => {
    const port = '/dev/tty.usbmodem0x80000001';
    const controller = new SerialFlightController(port, 115200);
    const useCase = new ExecuteCliUseCase(controller, new CliParser());

    console.log('--- Starting connection test ---');
    await controller.connect();
    console.log('--- Connection established ---');
    
    // Перевірка чи отримуємо ми хоч якісь дані
    let dataReceived = false;
    controller.onData(() => { dataReceived = true; });
    
    await new Promise((r) => setTimeout(r, 2000));
    console.log('--- Data received during wait:', dataReceived);
    
    // Далі виконуємо Use Case
    const result = await useCase.execute('version');
    console.log('--- Result:', result);
    
    expect(result).toContain('Betaflight / STM32F411');
    await controller.disconnect();
  }, 40000);
});
