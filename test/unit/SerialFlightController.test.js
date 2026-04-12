import { jest } from '@jest/globals';

// Mock SerialPort BEFORE importing the class
const mockPort = {
  open: jest.fn((cb) => {
    mockPort.isOpen = true;
    cb(null);
  }),
  write: jest.fn((data, cb) => cb && cb(null)),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  close: jest.fn((cb) => cb()),
  flush: jest.fn((cb) => cb && cb(null)),
  isOpen: false,
};

jest.unstable_mockModule('serialport', () => ({
  SerialPort: jest.fn(() => mockPort),
}));

// Import after mocking
const { default: SerialFlightController } = await import('../../src/infrastructure/SerialFlightController.js');
const { default: MSP } = await import('../../src/core/msp.js');

describe('SerialFlightController', () => {
  let controller;
  let portDataListener;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPort.isOpen = false;
    mockPort.on.mockImplementation((event, cb) => {
      if (event === 'data') portDataListener = cb;
    });

    mockLogger = {
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    controller = new SerialFlightController('/dev/tty.test', 115200, mockLogger);
  });

  test('connect() should perform MSP handshake and wait for CLI banner', async () => {
    const handshakePacket = MSP.encode(MSP.CMD.API_VERSION);
    // connect() calls #ensurePort() which sets up listeners
    const connectPromise = controller.connect();

    await new Promise((resolve) => { setTimeout(resolve, 50); });
    if (portDataListener) portDataListener(Buffer.from('\r\nCLI\r\n# '));

    await connectPromise;
    expect(mockPort.open).toHaveBeenCalled();
    expect(mockPort.write).toHaveBeenCalledWith(handshakePacket, expect.anything());
    expect(controller.isCliMode).toBe(true);
  });

  test('connect() should reject if port open fails', async () => {
    mockPort.open.mockImplementationOnce((cb) => setTimeout(() => cb(new Error('Open failed')), 0));
    await expect(controller.connect(1)).rejects.toThrow('Open failed');
  }, 10000);

  test('disconnect() should close port and reset state', async () => {
    const connectPromise = controller.connect();
    await new Promise((resolve) => { setTimeout(resolve, 50); });
    if (portDataListener) portDataListener(Buffer.from('\r\nCLI\r\n# '));
    await connectPromise;

    await controller.disconnect();
    expect(mockPort.close).toHaveBeenCalled();
    expect(controller.isCliMode).toBe(false);
  });

  test('clearBuffer should handle flush and its errors', () => {
    mockPort.isOpen = true;

    controller.clearBuffer();
    expect(mockPort.flush).toHaveBeenCalled();

    mockPort.flush.mockImplementationOnce((cb) => cb(new Error('Flush failed')));
    controller.clearBuffer();
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Flush failed'));
  });

  test('onData and removeListener should work correctly', () => {
    const cb = jest.fn();
    const unregister = controller.onData(cb);

    // Use public method handleData to trigger event internally
    controller.handleData(Buffer.from('test'));
    expect(cb).toHaveBeenCalledWith('test');

    unregister();
    controller.handleData(Buffer.from('ignored'));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
