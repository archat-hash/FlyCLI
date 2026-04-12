import { jest } from '@jest/globals';

// Given: serialport is mocked
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
const { default: executeCommand } = await import('../../src/commands/execute.js');

describe('executeCommand — port lifecycle', () => {
  let mockPort;
  let dataCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPort = {
      on: jest.fn((event, cb) => {
        if (event === 'data') dataCallback = cb;
      }),
      removeListener: jest.fn(),
      write: jest.fn((data, cb) => cb && cb(null)),
      open: jest.fn((cb) => cb(null)),
      close: jest.fn((cb) => cb(null)),
      isOpen: true,
      removeAllListeners: jest.fn(),
    };
    SerialPort.mockImplementation(() => mockPort);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should close the port after successful command execution', async () => {
    // Given: command is issued
    const cmdPromise = executeCommand(
      '/dev/tty.usbmodem1',
      '115200',
      'version',
      { json: false },
    );

    // When: firmware responds with CLI prompt and data
    await new Promise((r) => { setTimeout(r, 50); });
    dataCallback(Buffer.from('CLI\r\n# '));

    await new Promise((r) => { setTimeout(r, 300); });
    dataCallback(Buffer.from('version\r\nBetaflight / STM32F411\r\nCLI\r\n# '));

    await cmdPromise;

    // Then: port was closed (disconnect called)
    expect(mockPort.close).toHaveBeenCalled();
  }, 15000);
});
