import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
    SerialPort: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        write: jest.fn(),
        open: jest.fn((cb) => cb && cb(null)),
        close: jest.fn((cb) => cb && cb(null)),
        isOpen: true
    }))
}));

const { SerialPort } = await import('serialport');
const { default: Connection } = await import('../src/core/connection.js');
const { executeCommand } = await import('../src/commands/execute.js');

describe('executeCommand — cleanup', () => {
    let mockPort;
    let dataCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPort = {
            on: jest.fn((event, cb) => {
                if (event === 'data') dataCallback = cb;
            }),
            write: jest.fn(),
            open: jest.fn((cb) => cb && cb(null)),
            close: jest.fn((cb) => cb && cb(null)),
            isOpen: true,
            removeAllListeners: jest.fn()
        };
        SerialPort.mockImplementation(() => mockPort);
    });

    it('should close the port after command execution', async () => {
        const cmdPromise = executeCommand(
            '/dev/tty.usbmodem1',
            '115200',
            'version',
            { json: false }
        );

        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('Entering CLI Mode\r\n# '));
        dataCallback(Buffer.from('# Betaflight 4.3.2\r\n'));

        await new Promise((r) => setTimeout(r, 600));

        expect(mockPort.close).toHaveBeenCalledTimes(1);
    });

    it('should close the port on error', async () => {
        mockPort.open.mockImplementationOnce((cb) => cb(new Error('Port error')));

        await executeCommand('/dev/tty.error', '115200', 'version', { json: false });

        // Port failed to open, so close should not be called on a non-existent port
        expect(mockPort.close).not.toHaveBeenCalled();
    });
});
