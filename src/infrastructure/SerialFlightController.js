import { SerialPort } from 'serialport';
import EventEmitter from 'events';
import IFlightController from '../domain/IFlightController.js';
import MSP from '../core/msp.js';

import ConnectionState from '../domain/ConnectionState.js';

/**
 * SerialFlightController handles communication with a flight controller via a serial port.
 */
export default class SerialFlightController extends IFlightController {
  #path;

  #baudRate;

  #state;

  #buffer;

  #port;

  #events;

  /**
   * Creates an instance of SerialFlightController.
   * @param {string} path - The serial port path.
   * @param {number} baudRate - The baud rate for the serial connection.
   */
  constructor(path, baudRate) {
    super();
    this.#path = path;
    this.#baudRate = baudRate;
    this.#state = ConnectionState.DISCONNECTED;
    this.#buffer = '';
    this.#port = null;
    this.#events = new EventEmitter();
    this.setupPortListeners();
  }

  /**
   * Sets up event listeners for the serial port.
   */
  setupPortListeners() {
    if (!this.#port) {
      this.#port = new SerialPort({
        path: this.#path,
        baudRate: this.#baudRate,
        autoOpen: false,
      });
    }
    this.#port.on('data', (data) => this.handleData(data));
    this.#port.on('close', () => this.handleClose());
    this.#port.on('error', (err) => this.handleError(err));
  }

  /**
   * Handles the close event of the serial port.
   */
  handleClose() {
    this.#state = ConnectionState.DISCONNECTED;
    this.#events.emit('connection_lost');
  }

  /**
   * Handles errors from the serial port.
   * @param {Error} err - The error object.
   */
  handleError(err) {
    console.error(`Serial port error on ${this.#path}: ${err.message}`);
    this.handleClose();
  }

  /**
   * Processes incoming data from the serial port.
   * @param {Buffer} data - The incoming data.
   */
  handleData(data) {
    const chunk = data.toString();
    this.#buffer += chunk;

    this.#events.emit('data', chunk);

    if (this.#buffer.endsWith('# ')) {
      this.#events.emit('prompt', this.#buffer);
    } else if (this.#buffer.includes('CLI')) {
      this.#events.emit('banner', this.#buffer);
    }
  }

  /**
   * Clears the internal buffer and flushes the serial port.
   * @returns {Promise<void>}
   */
  async clearBuffer() {
    this.#buffer = '';
    return new Promise((resolve) => {
      if (this.#port && this.#port.isOpen && typeof this.#port.flush === 'function') {
        this.#port.flush((err) => {
          if (err) {
            console.error(`Error flushing port: ${err.message}`);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Waits for a specific pattern to appear in the buffer.
   * @param {string|RegExp} pattern - The pattern to wait for.
   * @param {number} [timeoutMs=10000] - Timeout in milliseconds.
   * @returns {Promise<string>}
   */
  async waitFor(pattern, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      let timeout;

      let cleanup;

      const onConnectionLost = () => {
        cleanup();
        reject(new Error(`Connection lost while waiting for pattern: ${pattern}`));
      };

      const onData = () => {
        const match = typeof pattern === 'string'
          ? this.#buffer.includes(pattern)
          : this.#buffer.match(pattern);

        if (match) {
          cleanup();
          resolve(this.#buffer);
        }
      };

      cleanup = () => {
        clearTimeout(timeout);
        this.#events.removeListener('data', onData);
        this.#events.removeListener('connection_lost', onConnectionLost);
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for pattern: ${pattern}`));
      }, timeoutMs);
      timeout.unref();

      this.#events.on('data', onData);
      this.#events.on('connection_lost', onConnectionLost);
      onData();

      if (this.#state === ConnectionState.DISCONNECTED && (!this.#port || !this.#port.isOpen)) {
        onConnectionLost();
      }
    });
  }

  async waitForDisconnect(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      let timeout;
      const onDisconnect = () => {
        clearTimeout(timeout);
        this.#port.removeListener('close', onDisconnect);
        this.#port.removeListener('error', onDisconnect);
        resolve();
      };

      timeout = setTimeout(() => {
        this.#port.removeListener('close', onDisconnect);
        this.#port.removeListener('error', onDisconnect);
        reject(new Error('Timeout waiting for disconnect'));
      }, timeoutMs);
      timeout.unref();

      this.#port.once('close', onDisconnect);
      this.#port.once('error', onDisconnect);

      if (this.#port.isOpen === false) {
        onDisconnect();
      }
    });
  }

  async reset() {
    this.#state = ConnectionState.DISCONNECTED;
    await this.clearBuffer();
    this.#events.removeAllListeners();
    if (this.#port && this.#port.isOpen) {
      return new Promise((resolve) => {
        this.#port.close(() => resolve());
      });
    }
    return Promise.resolve();
  }

  async connect(retries = 3) {
    if (this.#state === ConnectionState.CLI_MODE || this.#state === ConnectionState.CONNECTED) {
      return undefined;
    }

    this.#state = ConnectionState.CONNECTING;
    try {
      await this.#attemptConnect();
      this.#state = ConnectionState.CONNECTED;
      await this.attemptCliEntry();
      return undefined;
    } catch (err) {
      if (retries > 1) {
        await new Promise((resolve) => { setTimeout(resolve, 1000).unref(); });
        return this.connect(retries - 1);
      }
      throw err;
    }
  }

  #attemptConnect() {
    return new Promise((resolve, reject) => {
      if (this.#port.isOpen) {
        resolve();
        return;
      }
      this.#port.open((err) => {
        if (err) {
          reject(err);
          return;
        }
        this.clearBuffer()
          .then(() => this.sendRaw(MSP.encode(MSP.CMD.API_VERSION)))
          .then(resolve)
          .catch(reject);
      });
    });
  }

  async attemptCliEntry(retries = 10) {
    if (retries <= 0) {
      throw new Error('Failed to enter CLI mode: total timeout');
    }

    await this.sendRaw('#\n');

    try {
      await this.waitFor(/CLI|#\s?/, 1000);
      this.#state = ConnectionState.CLI_MODE;
    } catch (e) {
      await this.attemptCliEntry(retries - 1);
    }
  }

  async disconnect() {
    if (this.#state === ConnectionState.DISCONNECTED) return Promise.resolve();
    this.#state = ConnectionState.DISCONNECTING;
    await this.clearBuffer();
    this.#events.removeAllListeners();

    return new Promise((resolve) => {
      if (this.#port && this.#port.isOpen) {
        this.#port.close((err) => {
          if (err) {
            console.error(`Error closing port: ${err.message}`);
          }
          this.#state = ConnectionState.DISCONNECTED;
          resolve();
        });
      } else {
        this.#state = ConnectionState.DISCONNECTED;
        resolve();
      }
    });
  }

  async sendRaw(data) {
    return new Promise((resolve, reject) => {
      if (!this.#port || !this.#port.isOpen) {
        reject(new Error('Port not open'));
        return;
      }
      this.#port.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onData(callback) {
    this.#events.on('data', callback);
    return () => this.#events.removeListener('data', callback);
  }

  get buffer() {
    return this.#buffer;
  }

  get isCliMode() {
    return this.#state === ConnectionState.CLI_MODE;
  }
}
