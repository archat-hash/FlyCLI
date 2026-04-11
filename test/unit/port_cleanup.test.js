import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
    SerialPort: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        removeListener: jest.fn(),
        write: jest.fn(),
        open: jest.fn((cb) => { if (cb) cb(null); }),
        close: jest.fn((cb) => { if (cb) cb(); }),
        isOpen: false,
        removeAllListeners: jest.fn()
    }))
}));

const { SerialPort } = await import('serialport');
const { default: executeCommand } = await import('../../src/commands/execute.js');

describe('executeCommand — cleanup', () => {
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
            open: jest.fn((cb) => {
                if (cb) cb(null);
                mockPort.isOpen = true;
            }),
            close: jest.fn((cb) => {
                mockPort.isOpen = false;
                if (cb) cb();
            }),
            isOpen: false,
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
        dataCallback(Buffer.from('CLI\r\n# ')); // enter
        await new Promise((r) => setTimeout(r, 700)); // wait for command write + echo protection
        dataCallback(Buffer.from('out\r\nCLI\r\n# ')); // finish

        await cmdPromise;

        expect(mockPort.close).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should close the port on error', async () => {
        mockPort.open.mockImplementationOnce((cb) => cb(new Error('Port error')));

        await executeCommand(
            '/dev/tty.usbmodem1',
            '115200',
            'version',
            { json: false }
        );

        expect(mockPort.close).not.toHaveBeenCalled();
    });
});
