import { jest } from '@jest/globals';

jest.unstable_mockModule('serialport', () => ({
  SerialPort: {
    list: jest.fn(),
  },
}));

const { SerialPort } = await import('serialport');
const { default: PortScanner } = await import('../../src/infrastructure/PortScanner.js');

describe('PortScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new PortScanner();
    jest.clearAllMocks();
    delete process.env.FLYCLI_OVERRIDE_PORTS;
  });

  it('should return a list of parsed serial ports', async () => {
    const mockPorts = [
      {
        path: '/dev/tty.usbmodem1', manufacturer: 'STMicroelectronics', vendorId: '0483', productId: '5740',
      },
      {
        path: '/dev/tty.usbserial2',
      },
    ];
    SerialPort.list.mockResolvedValue(mockPorts);

    const ports = await scanner.listPorts();

    expect(ports).toBeInstanceOf(Array);
    expect(ports).toHaveLength(2);
    expect(ports[0].path).toBe('/dev/tty.usbmodem1');
    expect(ports[0].isLikelyBetaflight).toBe(true);
    expect(ports[1].manufacturer).toBe('Unknown');
    // 'usb' in path
    expect(ports[1].isLikelyBetaflight).toBe(true);
  });

  it('should handle FLYCLI_OVERRIDE_PORTS env variable', async () => {
    process.env.FLYCLI_OVERRIDE_PORTS = JSON.stringify([{ path: '/dev/override' }]);
    const ports = await scanner.listPorts();
    expect(ports[0].path).toBe('/dev/override');
    expect(SerialPort.list).not.toHaveBeenCalled();
  });

  it('should handle errors when listing ports', async () => {
    SerialPort.list.mockRejectedValue(new Error('Failed hardware'));
    await expect(scanner.listPorts()).rejects.toThrow('Failed to list serial ports: Failed hardware');
  });
});
