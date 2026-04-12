import { jest } from '@jest/globals';

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

describe('executeCommand — Data Fragmentation Fix', () => {
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
  });

  it('should NOT resolve if CLI\r\n# appears as part of data fragmentation with slow response', async () => {
    const cmdPromise = executeCommand(
      '/dev/tty.usbmodem1',
      '115200',
      'version',
      { json: true },
    );

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    /* Initial prompt */
    await new Promise((r) => { setTimeout(r, 50); });
    dataCallback(Buffer.from('CLI\r\n# '));

    /* Slow fragmented response */
    await new Promise((r) => { setTimeout(r, 300); });
    dataCallback(Buffer.from('version\r\n#'));

    await new Promise((r) => { setTimeout(r, 400); });
    dataCallback(Buffer.from(' Betaflight / STM32F411\r\nCLI\r\n# '));

    await cmdPromise;

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.output).toContain('Betaflight');

    logSpy.mockRestore();
  }, 15000);
});
