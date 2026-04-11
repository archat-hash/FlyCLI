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
        removeAllListeners: jest.fn()
    }))
}));

const { SerialPort } = await import('serialport');
const { default: executeCommand } = await import('../../src/commands/execute.js');

describe('executeCommand — Queue-based State Machine', () => {
    let mockPort;
    let dataCallback;
    let mockWrite;

    beforeEach(() => {
        jest.clearAllMocks();
        mockWrite = jest.fn();
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
            removeAllListeners: jest.fn()
        };
        SerialPort.mockImplementation(() => mockPort);
    });

    it('should correctly process command through states: ENTER -> DATA -> DONE', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const cmdPromise = executeCommand(
            '/dev/tty.usbmodem1',
            '115200',
            'version',
            { json: true }
        );

        // 1. Connection logic starts, it sends '#' and waits for response or banner
        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('##CLI\r\n# CLI ###\r\nCLI\r\n# '));

        // 2. Echo and data arrives
        await new Promise((r) => setTimeout(r, 100));
        dataCallback(Buffer.from('version\r\nCLI\r\n# Betaflight / STM32F411\r\nCLI\r\n# '));

        await cmdPromise;

        expect(logSpy).toHaveBeenCalled();
        const output = JSON.parse(logSpy.mock.calls[0][0]);
        // result includes echo
        expect(output.output).toBe('Betaflight / STM32F411');

        logSpy.mockRestore();
        errorSpy.mockRestore();
    }, 15000);

    it('should handle large fragmented data arriving after echo', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const cmdPromise = executeCommand(
            '/dev/tty.usbmodem1',
            '115200',
            'resource',
            { json: true }
        );

        // State: Entering
        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('CLI\r\n# '));

        // State: Echo
        await new Promise((r) => setTimeout(r, 300));
        dataCallback(Buffer.from('resource\r\n'));

        // State: Collecting Data (multiple chunks)
        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('resource BEEPER 1 A01\r\n'));
        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('resource MOTOR 1 B03\r\nCLI\r\n# '));

        await cmdPromise;

        expect(logSpy).toHaveBeenCalled();
        const output = JSON.parse(logSpy.mock.calls[0][0]);
        expect(output.output).toContain('MOTOR 1 B03');

        logSpy.mockRestore();
    }, 15000);
});
