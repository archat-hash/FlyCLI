import { SerialPort } from 'serialport';
import EventEmitter from 'events';
import IFlightController from '../domain/IFlightController.js';
import MSP from '../core/msp.js';

export default class SerialFlightController extends IFlightController {
  constructor(path, baudRate) {
    super();
    this.path = path;
    this.baudRate = baudRate;
    this.cliMode = false;
    this.buffer = '';
    this.port = null;
    this.events = new EventEmitter();
    this.setupPortListeners();
  }

  setupPortListeners() {
    if (!this.port) {
      this.port = new SerialPort({
        path: this.path,
        baudRate: this.baudRate,
        autoOpen: false,
      });
    }
    this.port.on('data', (data) => this.handleData(data));
  }

  handleData(data) {
    const chunk = data.toString();
    this.buffer += chunk;

    this.events.emit('data', chunk);

    // Prompt detection
    if (this.buffer.endsWith('# ')) {
      this.events.emit('prompt', this.buffer);
    } else if (this.buffer.includes('CLI')) {
      this.events.emit('banner', this.buffer);
    }
  }

  clearBuffer() {
    this.buffer = '';
    if (this.port && this.port.isOpen && typeof this.port.flush === 'function') {
      this.port.flush((err) => {
        if (err) {
          console.error(`Error flushing port: ${err.message}`);
        }
      });
    }
  }

  async waitFor(pattern, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      let timeout;
      const onData = () => {
        const match = typeof pattern === 'string'
          ? this.buffer.includes(pattern)
          : this.buffer.match(pattern);

        if (match) {
          clearTimeout(timeout);
          this.events.removeListener('data', onData);
          resolve(this.buffer);
        }
      };

      timeout = setTimeout(() => {
        this.events.removeListener('data', onData);
        reject(new Error(`Timeout waiting for pattern: ${pattern}`));
      }, timeoutMs);

      this.events.on('data', onData);
      onData(); // Check immediate
    });
  }

  async waitForDisconnect(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      let timeout;
      const onDisconnect = () => {
        clearTimeout(timeout);
        this.port.removeListener('close', onDisconnect);
        this.port.removeListener('error', onDisconnect);
        resolve();
      };

      timeout = setTimeout(() => {
        this.port.removeListener('close', onDisconnect);
        this.port.removeListener('error', onDisconnect);
        reject(new Error('Timeout waiting for disconnect'));
      }, timeoutMs);

      this.port.once('close', onDisconnect);
      this.port.once('error', onDisconnect);

      // Edge case: already closed (strict check for false to support mocks better)
      if (this.port.isOpen === false) {
        onDisconnect();
      }
    });
  }

  async connect() {
    if (this.port && this.port.isOpen) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.port.open(async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          this.clearBuffer();
          await this.sendRaw(MSP.encode(MSP.CMD.API_VERSION));

          await this.attemptCliEntry();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async attemptCliEntry(retries = 10) {
    if (retries <= 0) {
      throw new Error('Failed to enter CLI mode: total timeout');
    }

    await this.sendRaw('#\n');

    try {
      // Wait for either CLI banner or prompt (handling potential space-less echoes)
      await this.waitFor(/CLI|#\s?/, 1000);
      this.cliMode = true;
    } catch (e) {
      await this.attemptCliEntry(retries - 1);
    }
  }

  async disconnect() {
    this.clearBuffer();
    this.events.removeAllListeners();

    return new Promise((resolve) => {
      if (this.port && this.port.isOpen) {
        this.port.close((err) => {
          if (err) {
            console.error(`Error closing port: ${err.message}`);
          }
          this.cliMode = false;
          resolve();
        });
      } else {
        this.cliMode = false;
        resolve();
      }
    });
  }

  async sendRaw(data) {
    return new Promise((resolve, reject) => {
      if (!this.port || !this.port.isOpen) {
        reject(new Error('Port not open'));
        return;
      }
      this.port.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onData(callback) {
    this.events.on('data', callback);
    return () => this.events.removeListener('data', callback);
  }
}
