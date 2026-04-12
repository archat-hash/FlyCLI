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

const { default: ExecuteCliUseCase } = await import('../../src/application/commands/ExecuteCliUseCase.js');
const { default: SerialFlightController } = await import('../../src/infrastructure/SerialFlightController.js');
const { SerialPort } = await import('serialport');

const setup = () => {
  jest.clearAllMocks();
  const mockLogger = {
    info: jest.fn(), log: jest.fn(), error: jest.fn(), debug: jest.fn(),
  };
  const mockPort = {
    on: jest.fn(),
    removeListener: jest.fn(),
    write: jest.fn((data, cb) => { if (cb) cb(null); }),
    open: jest.fn((cb) => cb && cb(null)),
    close: jest.fn((cb) => cb && cb(null)),
    isOpen: true,
    removeAllListeners: jest.fn(),
  };
  SerialPort.mockImplementation(() => mockPort);

  const controller = new SerialFlightController('/dev/tty.usb', 115200, mockLogger);
  const useCase = new ExecuteCliUseCase(controller, mockLogger);
  return {
    controller, useCase, mockPort, mockLogger,
  };
};

describe('ExecuteCliUseCase — Success Paths', () => {
  it('should process command from entrance to result', async () => {
    const { useCase, mockPort } = setup();
    let dataCallback;
    mockPort.on.mockImplementation((event, cb) => { if (event === 'data') dataCallback = cb; });

    const executePromise = useCase.execute('version');
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('##CLI\r\n# ')); }, 10);
    setTimeout(() => { if (dataCallback) dataCallback(Buffer.from('v\r\n# Betaflight / STM32F411\r\n# ')); }, 20);

    const result = await executePromise;
    expect(result).toContain('Betaflight / STM32F411');
  });
});

describe('ExecuteCliUseCase — Error Resilience', () => {
  it('should throw TimeoutError when device does not respond', async () => {
    const { useCase } = setup();
    jest.spyOn(SerialFlightController.prototype, 'waitFor').mockImplementation(() => new Promise(() => {}));
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

    const executePromise = useCase.execute('status');
    jest.advanceTimersByTime(16000);

    await expect(executePromise).rejects.toThrow('Timeout');
    jest.useRealTimers();
  });

  it('should handle ConnectionError and DeviceError', async () => {
    const { useCase } = setup();
    // Test Connection Loss
    jest.spyOn(SerialFlightController.prototype, 'waitFor').mockRejectedValue(new Error('Connection lost'));
    await expect(useCase.execute('version')).rejects.toThrow('Connection lost');

    // Test Reboot Failure
    jest.spyOn(SerialFlightController.prototype, 'waitForDisconnect').mockRejectedValue(new Error('Fail'));
    await expect(useCase.execute('save')).rejects.toThrow('Device did not gracefully disconnect');
  });
});
