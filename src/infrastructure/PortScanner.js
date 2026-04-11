/* eslint-disable class-methods-use-this */
import { SerialPort } from 'serialport';

export default class PortScanner {
  /**
     * Lists all available serial ports.
     * @returns {Promise<Array>}
     */
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Unknown',
        vendorId: port.vendorId,
        productId: port.productId,
        isLikelyBetaflight: this.isLikelyBetaflight(port),
      }));
    } catch (error) {
      throw new Error(`Failed to list serial ports: ${error.message}`);
    }
  }

  /**
     * Heuristic to determine if a port is likely a Betaflight device.
     * @param {Object} port
     * @returns {boolean}
     */
  isLikelyBetaflight(port) {
    const manufacturer = (port.manufacturer || '').toLowerCase();
    const path = (port.path || '').toLowerCase();

    const knownManufacturers = [
      'stmicroelectronics',
      'silicon labs',
      'betaflight',
      'arduino', // Some flight controllers appear as Arduino
    ];

    const likelyPathPatterns = [
      'usb',
      'acm',
      'tty.usbmodem',
      'ttyusb',
    ];

    const hasKnownManufacturer = knownManufacturers.some((m) => manufacturer.includes(m));
    const hasLikelyPath = likelyPathPatterns.some((p) => path.includes(p));

    return hasKnownManufacturer || hasLikelyPath;
  }
}
