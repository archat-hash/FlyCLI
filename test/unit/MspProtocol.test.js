/* eslint-disable no-bitwise */
import { jest } from '@jest/globals';

const mockPort = {
  open: jest.fn((cb) => cb(null)),
  write: jest.fn((data, cb) => cb && cb(null)),
  on: jest.fn(),
  close: jest.fn((cb) => cb()),
  isOpen: true,
};

jest.unstable_mockModule('serialport', () => ({
  SerialPort: jest.fn(() => mockPort),
}));

const { default: MspProtocol } = await import('../../src/infrastructure/MspProtocol.js');
const { default: MSP } = await import('../../src/core/msp.js');

describe('MspProtocol', () => {
  let msp;
  let dataCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPort.on.mockImplementation((event, cb) => {
      if (event === 'data') dataCallback = cb;
    });
    msp = new MspProtocol('/dev/tty.test', 115200);
  });

  test('connect() should open serial port', async () => {
    await msp.connect();
    expect(mockPort.open).toHaveBeenCalled();
  });

  test('requestRc() should send MSP_RC command and parse response', async () => {
    await msp.connect();

    /*
     * Mock response for 4 channels: 1100, 1500, 1900, 1000
     * Each channel is uint16LE (2 bytes)
     */
    const payload = Buffer.from([
      0x4C, 0x04,
      0xDC, 0x05,
      0x6C, 0x07,
      0xE8, 0x03,
    ]);
    const responseFrame = MSP.encode(MSP.CMD.RC, payload);
    // Change $M< to $M> for response
    responseFrame[2] = 62;
    // Recalculate CRC because we changed direction byte
    let crc = payload.length ^ MSP.CMD.RC;
    for (let i = 0; i < payload.length; i += 1) {
      crc ^= payload[i];
    }
    responseFrame[responseFrame.length - 1] = crc;

    const rcPromise = msp.requestRc();

    // Simulate data arriving in chunks
    dataCallback(responseFrame.slice(0, 3));
    dataCallback(responseFrame.slice(3));

    const channels = await rcPromise;
    expect(channels).toEqual([1100, 1500, 1900, 1000]);
    expect(mockPort.write).toHaveBeenCalledWith(MSP.encode(MSP.CMD.RC), expect.anything());
  });

  test('requestRc() should timeout if no response', async () => {
    await msp.connect();
    await expect(msp.requestRc(10)).rejects.toThrow('timeout waiting for MSP_RC response');
  });

  test('should handle interleaved garbage data', async () => {
    await msp.connect();

    const payload = Buffer.from([0xDC, 0x05]);
    const frame = MSP.encode(MSP.CMD.RC, payload);
    frame[2] = 62;
    let crc = payload.length ^ MSP.CMD.RC;
    for (let i = 0; i < payload.length; i += 1) {
      crc ^= payload[i];
    }
    frame[frame.length - 1] = crc;

    const rcPromise = msp.requestRc();

    // Garbage + half header
    dataCallback(Buffer.from([0x00, 0xFF, 0x24]));
    // Rest of header
    dataCallback(Buffer.from([0x4D, 0x3E]));
    dataCallback(frame.slice(3));

    const channels = await rcPromise;
    expect(channels).toEqual([1500]);
  });
});
