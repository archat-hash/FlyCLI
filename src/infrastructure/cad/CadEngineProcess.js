import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manages the FreeCAD process and IPC communication.
 * @implements {ICadEngineProcess}
 */
export class CadEngineProcess {
  constructor(logger = console) {
    this.logger = logger;
    this.process = null;
    this.socket = null;
    this.port = 9099; // Default port
    this.requestMap = new Map();
    this.requestIdCounter = 1;
  }

  /**
   * Starts the FreeCAD process and connects to the IpcBridge.
   * @param {string} executablePath 
   * @returns {Promise<void>}
   */
  async start(executablePath) {
    if (this.process) {
      throw new Error('FreeCAD process is already running.');
    }

    const listenerPath = path.resolve(__dirname, '../../../assets/python/freecad_listener.py');
    
    // We launch FreeCAD GUI and pass the listener script to run on startup
    this.logger.info(`Launching FreeCAD from ${executablePath}...`);
    this.process = spawn(executablePath, [listenerPath, this.port.toString()], {
      detached: false, // For MVP we keep it attached to FlyCLI process lifecycle
      stdio: ['ignore', 'pipe', 'pipe']
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

    // Wait for the IPC socket to become available
    return this._waitForConnection();
  }

  async _waitForConnection(retries = 15, delayMs = 1000) {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attemptConnection = () => {
        attempts++;
        this.logger.info(`Attempting to connect to FreeCAD IPC... (${attempts}/${retries})`);
        
        const socket = new net.Socket();
        
        socket.connect(this.port, '127.0.0.1', () => {
          this.logger.info('Successfully connected to FreeCAD IPC.');
          this.socket = socket;
          this._setupSocketListeners();
          resolve();
        });

        socket.on('error', (err) => {
          socket.destroy();
          if (attempts >= retries) {
            reject(new Error(`Failed to connect to FreeCAD IPC after ${retries} attempts.`));
          } else {
            setTimeout(attemptConnection, delayMs);
          }
        });
      };

      attemptConnection();
    });
  }

  _setupSocketListeners() {
    let buffer = '';
    this.socket.on('data', (data) => {
      buffer += data.toString('utf-8');
      
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        
        if (line) {
          try {
            const response = JSON.parse(line);
            this._handleResponse(response);
          } catch (e) {
            this.logger.error('Failed to parse IPC response', e);
          }
        }
      }
    });

    this.socket.on('close', () => {
      this.logger.info('IPC connection closed.');
      this.socket = null;
    });
  }

  _handleResponse(response) {
    const { id } = response;
    if (this.requestMap.has(id)) {
      const { resolve, reject } = this.requestMap.get(id);
      this.requestMap.delete(id);
      
      if (response.status === 'ERROR') {
        reject(new Error(`CadEngine Error: ${JSON.stringify(response.error)}`));
      } else {
        resolve(response.data);
      }
    }
  }

  _sendRequest(action, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('IPC Socket is not connected.'));
      }

      const id = `req_${this.requestIdCounter++}`;
      this.requestMap.set(id, { resolve, reject });

      const msg = JSON.stringify({ id, action, payload }) + '\n';
      this.socket.write(msg, 'utf-8', (err) => {
        if (err) {
          this.requestMap.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * Stops the FreeCAD process.
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
   * Sends a GeometryScript to FreeCAD for execution.
   * @param {string} scriptContent 
   * @returns {Promise<Object>}
   */
  async executeScript(scriptContent) {
    return this._sendRequest('EXECUTE_SCRIPT', { code: scriptContent });
  }

  /**
   * Reads the object tree from the FreeCAD document.
   * @returns {Promise<Object>}
   */
  async getDocumentState() {
    return this._sendRequest('GET_STATE');
  }
}
