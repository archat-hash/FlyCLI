import { SerialPort } from 'serialport';

export default class Scanner {
  /**
     * Lists all available serial ports.
     * @returns {Promise<Array>} List of ports.
     */
  static async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports;
    } catch (error) {
      throw new Error(`Failed to list ports: ${error.message}`);
    }
  }
}
