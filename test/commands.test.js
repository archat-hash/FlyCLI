import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
    SerialPort: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        write: jest.fn(),
        open: jest.fn((cb) => cb && cb(null)),
        close: jest.fn((cb) => cb && cb(null)),
        isOpen: true
    })),
    SerialPort: {
        list: jest.fn()
    }
}));

const { SerialPort } = await import('serialport');
const { default: Scanner } = await import('../src/core/scanner.js');
const { default: Connection } = await import('../src/core/connection.js');

describe('CLI Commands', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('scan command', () => {
        it('should return formatted list of ports as JSON', async () => {
            SerialPort.list.mockResolvedValue([
                { path: '/dev/tty.usbmodem1', manufacturer: 'STMicroelectronics', vendorId: '0483', productId: '5740' }
            ]);

            const ports = await Scanner.listPorts();
            const json = JSON.stringify(ports);

            expect(json).toContain('/dev/tty.usbmodem1');
            expect(json).toContain('0483');
        });
    });
});
