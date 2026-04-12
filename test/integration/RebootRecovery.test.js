import fs from 'fs';
import ExecuteCliUseCase from '../../src/application/ExecuteCliUseCase.js';
import SerialFlightController from '../../src/infrastructure/SerialFlightController.js';
import PortScanner from '../../src/infrastructure/PortScanner.js';

// Given:  FC receives 'save' command
// When:   FC saves config and reboots
// Then:   ExecuteCliUseCase should catch the disconnect gracefully
//         and return [REBOOT_INITIATED] instead of hanging or crashing.

describe('Reboot Recovery Integration', () => {
  it('should detect port disconnect after save command triggers FC reboot', async () => {
    const scanner = new PortScanner();
    const ports = await scanner.listPorts();
    const device = ports.find((p) => p.isLikelyBetaflight);
    let port = process.env.TEST_PORT || (device ? device.path : null);

    if (!port || !fs.existsSync(port)) {
      console.warn(`[SKIPPED] Integration test skipped: Physical device not found at ${port || 'any port'}`);
      return;
    }

    // Given: connected and in CLI mode
    const controller = new SerialFlightController(port, 115200);
    const useCase = new ExecuteCliUseCase(controller);

    // When: execute 'save'
    const result = await useCase.execute('save');

    // Then: it should return the specific token indicating successful disconnect
    expect(result).toBe('[REBOOT_INITIATED]');

    // Додаємо чесне опитування (polling), щоб BDD тести побачили дрон після перезапуску.
    // Опитуємо кожні 500мс, щоб не забивати event loop та FS (уникаємо "DDoS").
    let reconnected = false;
    for (let i = 0; i < 40; i += 1) { // Максимум 20 секунд (40 * 500мс)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, 500).unref(); });
      
      // Динамічний пошук порту, бо на Mac після ребуту він може змінити ім'я
      // eslint-disable-next-line no-await-in-loop
      const rp = await scanner.listPorts();
      const rd = rp.find((p) => p.isLikelyBetaflight);
      if (rd && fs.existsSync(rd.path)) {
        reconnected = true;
        port = rd.path;
        break;
      }
    }

    if (!reconnected) {
      console.warn(`\n[WARNING] Дрон на ${port} не повернувся протягом 20 секунд після команди save. Наступні BDD тести можуть бути пропущені.`);
    }
  }, 30000); // Збільшено таймаут тесту до 30с, щоб покрити 20с очікування
});
