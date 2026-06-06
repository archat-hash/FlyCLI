import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * @module CadEngineProcess
 * @description Manages the FreeCAD process and IPC communication (IpcBridge).
 *
 * Traceability:
 *   - Interface: ddd_interfaces.md § ICadEngineProcess, IpcBridge
 *   - Architecture: implementation_plan.md § CadEngineProcess
 *   - IPC Payload: ddd_interfaces.md § IPC Payload Contracts (JSON over TCP)
 *   - CQRS: start/stop/executeScript [Commands]; getDocumentState [Query]
 */

const DEFAULT_PORT = 9099;
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 1000;

/**
 * Returns the absolute path to the Python IPC listener script.
 * @returns {string}
 */
function resolveListenerPath() {
  return path.resolve(dirname, '../../../assets/python/freecad_listener.py');
}

/**
 * Parses a newline-delimited JSON buffer and returns complete messages.
 * @param {string} buffer
 * @returns {{ messages: Object[], remaining: string }}
 */
function parseBuffer(buffer) {
  const messages = [];
  let remaining = buffer;
  let idx = remaining.indexOf('\n');

  while (idx !== -1) {
    const line = remaining.slice(0, idx).trim();
    remaining = remaining.slice(idx + 1);

    if (line) {
      try {
        messages.push(JSON.parse(line));
      } catch {
        /*
         * Malformed JSON from FreeCAD — silently skip.
         * The caller logs errors via _handleResponse.
         */
      }
    }
    idx = remaining.indexOf('\n');
  }

  return { messages, remaining };
}

/**
 * Attempts a single TCP connection to the IPC socket.
 * @param {number} port
 * @returns {Promise<net.Socket>}
 */
function tryConnect(port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect(port, '127.0.0.1', () => resolve(socket));
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

/**
 * Manages the FreeCAD process and IPC communication.
 * @implements {ICadEngineProcess}
 */
export class CadEngineProcess {
  /**
   * @param {object} logger
   */
  constructor(logger = console) {
    this.logger = logger;
    this.process = null;
    this.socket = null;
    this.port = DEFAULT_PORT;
    this.requestMap = new Map();
    this.requestIdCounter = 1;
  }

  /**
   * [COMMAND] Starts the FreeCAD process and connects to the IpcBridge.
   * @param {string} executablePath
   * @returns {Promise<void>}
   */
  async start(executablePath) {
    if (this.process) {
      throw new Error('FreeCAD process is already running.');
    }

    const listenerPath = resolveListenerPath();
    this.logger.info(`Launching FreeCAD from ${executablePath}...`);

    this.process = spawn(executablePath, [listenerPath, String(this.port)], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.process.stdout.on('data', (data) => {
      this.logger.debug(`[FreeCAD STDOUT]: ${data.toString().trim()}`);
    });

    this.process.stderr.on('data', (data) => {
      this.logger.debug(`[FreeCAD STDERR]: ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.logger.info(`FreeCAD process exited with code ${code}`);
      this.process = null;
      this.socket = null;
    });

    await this.waitForConnection();
  }

  /**
   * Retries TCP connection until FreeCAD IPC socket is available.
   * @param {number} retries
   * @param {number} delayMs
   * @returns {Promise<void>}
   */
  async waitForConnection(retries = MAX_RETRIES, delayMs = RETRY_DELAY_MS) {
    let attempts = 0;

    const attempt = async () => {
      attempts += 1;
      this.logger.info(`Attempting IPC connection… (${attempts}/${retries})`);

      try {
        this.socket = await tryConnect(this.port);
        this.setupSocketListeners();
        this.logger.info('Connected to FreeCAD IPC.');
      } catch {
        if (attempts >= retries) {
          throw new Error(`Failed to connect to FreeCAD IPC after ${retries} attempts.`);
        }
        await new Promise((res) => { setTimeout(res, delayMs); });
        await attempt();
      }
    };

    await attempt();
  }

  /**
   * Wires data/close handlers on the IPC socket.
   */
  setupSocketListeners() {
    let buffer = '';

    this.socket.on('data', (data) => {
      buffer += data.toString('utf-8');
      const { messages, remaining } = parseBuffer(buffer);
      buffer = remaining;
      messages.forEach((msg) => this.handleResponse(msg));
    });

    this.socket.on('close', () => {
      this.logger.info('IPC connection closed.');
      this.socket = null;
    });
  }

  /**
   * Resolves or rejects a pending request based on the IPC response.
   * @param {Object} response
   */
  handleResponse(response) {
    const { id } = response;

    if (!this.requestMap.has(id)) {
      return;
    }

    const { resolve, reject } = this.requestMap.get(id);
    this.requestMap.delete(id);

    if (response.status === 'ERROR') {
      reject(new Error(`CadEngine Error: ${JSON.stringify(response.error)}`));
    } else {
      resolve(response.data);
    }
  }

  /**
   * Sends a JSON request over the IPC socket and returns a Promise.
   * @param {string} action
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  sendRequest(action, payload = {}) {
    if (!this.socket) {
      return Promise.reject(new Error('IPC Socket is not connected.'));
    }

    return new Promise((resolve, reject) => {
      const id = `req_${this.requestIdCounter}`;
      this.requestIdCounter += 1;
      this.requestMap.set(id, { resolve, reject });

      const msg = `${JSON.stringify({ id, action, payload })}\n`;
      this.socket.write(msg, 'utf-8', (err) => {
        if (err) {
          this.requestMap.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * [COMMAND] Stops the FreeCAD process and closes the IPC socket.
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * [COMMAND] Sends a GeometryScript to FreeCAD for execution.
   * @param {string} scriptContent - Python/CadQuery code
   * @returns {Promise<Object>} Execution result
   */
  async executeScript(scriptContent) {
    return this.sendRequest('EXECUTE_SCRIPT', { code: scriptContent });
  }

  /**
   * [QUERY] Reads the object tree from the open FreeCAD document.
   * @returns {Promise<Object>} Serialized EngineState
   */
  async getDocumentState() {
    return this.sendRequest('GET_STATE');
  }
}

export default CadEngineProcess;
