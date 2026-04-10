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

describe('executeCommand — bug fix: command sent only once', () => {
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
            write: mockWrite,
            open: jest.fn((cb) => cb && cb(null)),
            close: jest.fn((cb) => cb && cb(null)),
            isOpen: true,
            removeAllListeners: jest.fn()
        };
        SerialPort.mockImplementation(() => mockPort);
    });

    it('should send the CLI command exactly once even if prompt appears in multiple chunks', async () => {
        const cmdPromise = executeCommand(
            '/dev/tty.usbmodem1',
            '115200',
            'version',
            { json: false }
        );

        // Simulate CLI prompt arriving in separate chunks (as it really does)
        await new Promise((r) => setTimeout(r, 50));
        dataCallback(Buffer.from('Entering CLI Mode\r\n# '));    // chunk 1 — triggers prompt detection
        dataCallback(Buffer.from('Betaflight info\r\n# '));       // chunk 2 — prompt again (the bug re-triggers here)
        dataCallback(Buffer.from('more data\r\n# '));             // chunk 3 — another re-trigger

        await new Promise((r) => setTimeout(r, 600));

        // Count only user-command writes (not MSP handshake, not '#' for CLI enter)
        const userCmdWrites = mockWrite.mock.calls.filter(
            (call) => call[0] === 'version\n'
        );

        expect(userCmdWrites).toHaveLength(1); // must be exactly 1, not 3
    });
});
