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
const { default: executeCommand } = await import('../../src/commands/execute.js');

describe('executeCommand — Debounce Fix', () => {
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

  it('should wait for debounce before finalizing and include all data', async () => {
    const cmdPromise = executeCommand(
      '/dev/tty.usbmodem1',
      '115200',
      'version',
      { json: true },
    );

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    // 1. Initial prompt
    await new Promise((r) => { setTimeout(r, 50); });
    dataCallback(Buffer.from('CLI\r\n# '));

    // 2. Data + prompt arrives in one piece or slightly fragmented
    await new Promise((r) => { setTimeout(r, 300); });
    // We ensure there is a newline before the CLI\r\n# to avoid line merging issues in parser
    dataCallback(Buffer.from('version\r\nCLI\r\n# Betaflight / 4.3.2\r\nCLI\r\n# \r\nextra line\r\nCLI\r\n# '));

    // Wait for debounce to finish
    await new Promise((r) => { setTimeout(r, 500); });

    await cmdPromise;

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.output).toContain('Betaflight');
    expect(output.output).toContain('extra line');

    logSpy.mockRestore();
  }, 15000);
});
