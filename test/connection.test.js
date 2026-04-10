import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
    SerialPort: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        write: jest.fn(),
        open: jest.fn((cb) => cb && cb(null)),
        close: jest.fn((cb) => cb && cb(null)),
        isOpen: false
    }))
}));

const { SerialPort } = await import('serialport');
const { default: Connection } = await import('../src/core/connection.js');

describe('Connection', () => {
    let mockPort;
    let dataCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPort = {
            on: jest.fn((event, cb) => { if (event === 'data') dataCallback = cb; }),
            write: jest.fn(),
            open: jest.fn((cb) => cb && cb(null)),
            close: jest.fn((cb) => cb && cb(null)),
            isOpen: true
        };
        SerialPort.mockImplementation(() => mockPort);
    });

    it('should open the serial port with correct parameters', async () => {
        const path = '/dev/tty.usbmodem1';
        const baudRate = 115200;

        await Connection.open(path, baudRate);

        expect(SerialPort).toHaveBeenCalledWith(expect.objectContaining({
            path,
            baudRate,
            autoOpen: false
        }));
    });

    it('should throw error if port fails to open', async () => {
        mockPort.open.mockImplementationOnce((cb) => cb(new Error('Open failed')));

        await expect(Connection.open('/dev/tty.error', 115200)).rejects.toThrow('Open failed');
    });

    it('should send MSP_API_VERSION request after opening', async () => {
        const path = '/dev/tty.usbmodem1';
        await Connection.open(path, 115200);

        // MSP_API_VERSION = 1, Payload Size = 0
        // Packet: $M< (3 bytes) + size(0) + type(1) + checksum(1)
        // Checksum for size 0 type 1 is 0 ^ 1 = 1
        expect(mockPort.write).toHaveBeenCalledWith(expect.any(Buffer));
        const sentBuffer = mockPort.write.mock.calls[0][0];
        expect(sentBuffer[0]).toBe(36); // $
        expect(sentBuffer[1]).toBe(77); // M
        expect(sentBuffer[2]).toBe(60); // <
        expect(sentBuffer[3]).toBe(0);  // size
        expect(sentBuffer[4]).toBe(1);  // type (MSP_API_VERSION)
        expect(sentBuffer[5]).toBe(1);  // checksum
    });
});
