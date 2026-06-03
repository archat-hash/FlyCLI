import { SerialPort } from 'serialport';
import EventEmitter from 'events';
import MSP from '../core/msp.js';

/**
 * MspProtocol handles binary MSP (MultiWii Serial Protocol) communication
 * directly over a raw serial port, independent of CLI text mode.
 *
 * Used by interactive wizards (e.g. RC Calibration) that need
 * real-time telemetry polling rather than text command/response cycles.
 */
export default class MspProtocol {
  #path;

  #baudRate;

  #port;

  #events;

  #rxBuffer;

  /**
   * @param {string} path - Serial port path (e.g. COM3 or /dev/ttyUSB0)
   * @param {number} baudRate - Baud rate (e.g. 115200)
   */
  constructor(path, baudRate) {
    this.#path = path;
    this.#baudRate = baudRate;
    this.#port = null;
    this.#events = new EventEmitter();
    this.#rxBuffer = Buffer.alloc(0);
  }

  /**
   * Opens the serial port and starts listening for binary MSP frames.
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        if (this.#port && this.#port.isOpen) {
          resolve();
          return;
        }

        this.#port = new SerialPort({
          path: this.#path,
          baudRate: this.#baudRate,
          autoOpen: false,
        });

        this.#port.on('data', (chunk) => this.#handleData(chunk));
        this.#port.on('error', (err) => {
          this.#events.emit('error', err);
        });

        this.#port.open((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Closes the serial port.
   * @returns {Promise<void>}
   */
  disconnect() {
    return new Promise((resolve) => {
      if (this.#port && this.#port.isOpen) {
        this.#port.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Sends a raw MSP request frame for the given command.
   * @param {number} cmd - MSP command ID (e.g. MSP.CMD.RC = 105)
   * @returns {Promise<void>}
   */
  request(cmd) {
    return new Promise((resolve, reject) => {
      if (!this.#port || !this.#port.isOpen) {
        reject(new Error('MspProtocol: port is not open'));
        return;
      }
      const frame = MSP.encode(cmd);
      this.#port.write(frame, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Sends MSP_RC request and returns parsed channel values.
   * Resolves with an array of up to 16 channel values (1000-2000 range).
   * @param {number} [timeoutMs=200] - Timeout waiting for response.
   * @returns {Promise<number[]>}
   */
  requestRc(timeoutMs = 200) {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const onRc = (channels) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer); // eslint-disable-line no-use-before-define
          resolve(channels);
        }
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.#events.removeListener('msp_rc', onRc);
          reject(new Error('MspProtocol: timeout waiting for MSP_RC response'));
        }
      }, timeoutMs);
      timer.unref();

      this.#events.once('msp_rc', onRc);
      this.request(MSP.CMD.RC).catch((err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          this.#events.removeListener('msp_rc', onRc);
          reject(err);
        }
      });
    });
  }

  /**
   * Accumulates incoming binary data and tries to extract MSP frames.
   * @param {Buffer} chunk
   */
  #handleData(chunk) {
    this.#rxBuffer = Buffer.concat([this.#rxBuffer, chunk]);
    this.#processBuffer();
  }

  /**
   * Finds the next frame start in the buffer, stripping any leading garbage bytes.
   * @returns {number} Index of frame start, or -1 if not found.
   */
  #findFrameStart() {
    return this.#rxBuffer.indexOf(Buffer.from([0x24, 0x4D]));
  }

  /**
   * Parses a complete MSP frame and emits 'msp_rc' if it is a valid RC packet.
   * @param {Buffer} frame
   */
  #dispatchPacket(frame) {
    const packet = MSP.parse(frame);
    if (packet && !packet.crcError && packet.type === MSP.CMD.RC) {
      this.#events.emit('msp_rc', MspProtocol.#parseRcPayload(packet.payload));
    }
  }

  /**
   * Attempts to extract and dispatch a single complete MSP frame.
   * @returns {boolean} true if a frame was consumed, false if buffer is incomplete.
   */
  #extractFrame() {
    if (this.#rxBuffer.length < 6) return false;

    const size = this.#rxBuffer[3];
    const frameLength = 6 + size;

    if (this.#rxBuffer.length < frameLength) return false;

    const frame = this.#rxBuffer.slice(0, frameLength);
    this.#rxBuffer = this.#rxBuffer.slice(frameLength);
    this.#dispatchPacket(frame);
    return true;
  }

  /**
   * Cleans the buffer by discarding bytes that cannot be part of a frame start.
   */
  #cleanBuffer() {
    const start = this.#findFrameStart();
    if (start === -1) {
      // If 0x24 is at the end, keep it, otherwise clear.
      if (this.#rxBuffer[this.#rxBuffer.length - 1] === 0x24) {
        this.#rxBuffer = this.#rxBuffer.slice(this.#rxBuffer.length - 1);
      } else {
        this.#rxBuffer = Buffer.alloc(0);
      }
      return -1;
    }
    if (start > 0) {
      this.#rxBuffer = this.#rxBuffer.slice(start);
    }
    return 0;
  }

  /**
   * Searches the rx buffer for valid MSP response frames and emits events.
   * Frame format: $ M > <size> <type> [payload...] <crc>
   */
  #processBuffer() {
    let running = true;
    while (running && this.#rxBuffer.length > 0) {
      if (this.#cleanBuffer() === -1) {
        running = false;
      } else {
        running = this.#extractFrame();
      }
    }
  }

  /**
   * Parses the MSP_RC payload into an array of channel values.
   * Each channel is a uint16 little-endian value.
   * @param {Buffer} payload
   * @returns {number[]}
   */
  static #parseRcPayload(payload) {
    const channels = [];
    for (let i = 0; i + 1 < payload.length; i += 2) {
      channels.push(payload.readUInt16LE(i));
    }
    return channels;
  }
}
