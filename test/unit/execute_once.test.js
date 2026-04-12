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
const { default: executeCommand } = await import('../../src/interfaces/cli/execute.js');

describe('executeCommand — cleanup', () => {
  let mockPort;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPort = {
      on: jest.fn(),
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

  it('should close the port on error', async () => {
    mockPort.open.mockImplementationOnce((cb) => cb(new Error('Port error')));

    await executeCommand(
      '/dev/tty.usbmodem1',
      '115200',
      'version',
      { json: false },
    );

    expect(mockPort.close).toHaveBeenCalled();
  }, 20000);
});
