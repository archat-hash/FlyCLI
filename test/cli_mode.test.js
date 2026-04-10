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

describe('Connection CLI Mode', () => {
    let mockPort;
    let dataCallback;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPort = {
            on: jest.fn((event, cb) => { if (event === 'data') dataCallback = cb; }),
            write: jest.fn(),
            open: jest.fn((cb) => cb && cb(null)),
            close: jest.fn((cb) => cb && cb(null)),
            isOpen: true,
            removeAllListeners: jest.fn()
        };
        SerialPort.mockImplementation(() => mockPort);
    });

    it('should send # to enter CLI mode', async () => {
        const conn = new Connection(mockPort);
        await conn.enterCliMode();

        expect(mockPort.write).toHaveBeenCalledWith(Buffer.from('#'));
    });

    it('should emit text data when in CLI mode', async () => {
        const conn = new Connection(mockPort);
        const textListener = jest.fn();
        conn.on('cli-data', textListener);

        await conn.enterCliMode();

        // Simulate receiving "### CLI ###"
        dataCallback(Buffer.from('### CLI ###\n'));

        expect(textListener).toHaveBeenCalledWith('### CLI ###\n');
    });
});
