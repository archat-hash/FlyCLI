import { jest } from '@jest/globals';

// Define the mock before importing any modules that might use it
jest.unstable_mockModule('serialport', () => ({
    SerialPort: {
        list: jest.fn()
    }
}));

// Use dynamic imports to ensure the mock is applied
const { SerialPort } = await import('serialport');
const { default: Scanner } = await import('../../src/core/scanner.js');

describe('Scanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of available serial ports', async () => {
        const mockPorts = [
            { path: '/dev/tty.usbmodem1', manufacturer: 'Betaflight' },
            { path: '/dev/tty.usbserial2', manufacturer: 'Generic' }
        ];
        SerialPort.list.mockResolvedValue(mockPorts);

        const ports = await Scanner.listPorts();

        expect(ports).toBeInstanceOf(Array);
        expect(ports).toHaveLength(2);
        expect(ports[0].path).toBe('/dev/tty.usbmodem1');
        expect(SerialPort.list).toHaveBeenCalled();
    });

    it('should handle errors when listing ports', async () => {
        SerialPort.list.mockRejectedValue(new Error('Failed to list ports'));

        await expect(Scanner.listPorts()).rejects.toThrow('Failed to list ports');
    });
});
