import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
  SerialPort: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    removeListener: jest.fn(),
    write: jest.fn(),
    open: jest.fn((cb) => { if (cb) cb(null); }),
    close: jest.fn((cb) => { if (cb) cb(null); }),
    isOpen: false,
    removeAllListeners: jest.fn(),
  })),
}));

const { default: ExecuteCliUseCase } = await import('../../src/application/commands/ExecuteCliUseCase.js');
const { default: SerialFlightController } = await import('../../src/infrastructure/SerialFlightController.js');
const { SerialPort } = await import('serialport');

const setup = () => {
  jest.clearAllMocks();
  const mockLogger = {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const mockPort = {
    on: jest.fn(),
    removeListener: jest.fn(),
    write: jest.fn((data, cb) => { if (cb) cb(null); }),
    open: jest.fn(function open(cb) {
      this.isOpen = true;
      if (cb) cb(null);
    }),
    close: jest.fn(function close(cb) {
      this.isOpen = false;
      if (cb) cb(null);
    }),
    isOpen: false,
    removeAllListeners: jest.fn(),
  };
  SerialPort.mockImplementation(() => mockPort);

  const controller = new SerialFlightController('/dev/tty.usb', 115200, mockLogger);
  const useCase = new ExecuteCliUseCase(controller, mockLogger);
  return {
    controller, useCase, mockPort, mockLogger,
  };
};

describe('ExecuteCliUseCase — Batch Execution', () => {
  it('should execute multiple commands in a single session', async () => {
    const { useCase, mockPort } = setup();
    let dataCallback;
    mockPort.on.mockImplementation((event, cb) => {
      if (event === 'data') dataCallback = cb;
    });

    const commands = ['version', 'status'];
    const executePromise = useCase.execute(commands);

    // Simulate MSP handshake and first command response
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('##CLI\r\n# ')); }, 50);
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('version\r\n# Betaflight 4.4.0\r\n# ')); }, 150);

    // Simulate second command response
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('status\r\n# System Uptime: 10s\r\n# ')); }, 400);

    const result = await executePromise;

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toContain('Betaflight 4.4.0');
    expect(result[1]).toContain('System Uptime: 10s');

    // Check that open was called only once (connect() is called for the batch)
    expect(mockPort.open).toHaveBeenCalledTimes(1);
  });

  it('should stop batch execution on reboot command', async () => {
    const { useCase, mockPort } = setup();
    let dataCallback;
    mockPort.on.mockImplementation((event, cb) => {
      if (event === 'data') dataCallback = cb;
    });

    // Mock waitForDisconnect to resolve immediately
    jest.spyOn(SerialFlightController.prototype, 'waitForDisconnect').mockResolvedValue(true);

    const commands = ['set p_pitch=50', 'save', 'version'];
    const executePromise = useCase.execute(commands);

    // Responses
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('##CLI\r\n# ')); }, 50);
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('set p_pitch=50\r\n# ')); }, 100);
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('save\r\nRebooting\r\n')); }, 150);

    const result = await executePromise;

    expect(result.length).toBe(2);
    expect(result[1]).toContain('[REBOOT_INITIATED]');
  });
});
