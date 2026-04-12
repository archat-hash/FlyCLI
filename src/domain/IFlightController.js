/**
 * Interface for flight controller implementations.
 * @interface
 */
export default class IFlightController {
  async connect() {
    throw new Error('Not implemented');
  }

  async disconnect() {
    throw new Error('Not implemented');
  }

  async sendRaw(data) {
    throw new Error(`Not implemented for data: ${data}`);
  }

  onData(callback) {
    throw new Error(`Not implemented for callback: ${callback}`);
  }

  async waitForDisconnect(timeoutMs) {
    throw new Error(`Not implemented for timeout: ${timeoutMs}`);
  }
}
