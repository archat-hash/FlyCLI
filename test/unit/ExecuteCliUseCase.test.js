import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
  SerialPort: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    removeListener: jest.fn(),
    write: jest.fn(),
    open: jest.fn((cb) => cb && cb(null)),
    close: jest.fn((cb) => cb && cb(null)),
    isOpen: true,
    removeAllListeners: jest.fn(),
  })),
}));

const { SerialPort } = await import('serialport');
const ExecuteCliUseCase = (await import('../../src/application/ExecuteCliUseCase.js')).default;
const SerialFlightController = (await import('../../src/infrastructure/SerialFlightController.js')).default;

describe('ExecuteCliUseCase — BDD Style', () => {
  let controller;
  let useCase;
  let mockPort;
  let dataCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPort = {
      on: jest.fn((event, cb) => {
        if (event === 'data') dataCallback = cb;
      }),
      removeListener: jest.fn(),
      write: jest.fn((data, cb) => {
        if (cb) cb(null);
      }),
      open: jest.fn((cb) => cb && cb(null)),
      close: jest.fn((cb) => cb && cb(null)),
      isOpen: true,
      removeAllListeners: jest.fn(),
    };
    SerialPort.mockImplementation(() => mockPort);

    controller = new SerialFlightController('/dev/tty.usb');
    useCase = new ExecuteCliUseCase(controller);
  });

  it('should process command from entrance to result', async () => {
    // Stage 1: Handshake
    const executePromise = useCase.execute('version');

    // FC responds to MSP API VERSION or we just send banner
    await new Promise((r) => { setTimeout(r, 50); });
    dataCallback(Buffer.from('##CLI\r\n# CLI ###\r\nCLI\r\n# '));

    // Stage 2: Data response
    await new Promise((r) => { setTimeout(r, 300); });
    dataCallback(Buffer.from('version\r\nCLI\r\n# Betaflight / STM32F411\r\nCLI\r\n# '));

    const result = await executePromise;
    expect(result).toBe('Betaflight / STM32F411');
  }, 15000);
});
