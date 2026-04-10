import { EventEmitter } from 'events';
import { SerialPort } from 'serialport';
import MSP from './msp.js';

export default class Connection extends EventEmitter {
    constructor(port = null) {
        super();
        this.port = port;
    }

    /**
     * Opens a serial port connection.
     * @param {string} path Port path.
     * @param {number} baudRate Baud rate.
     * @returns {Promise<Connection>} Connection instance.
     */
    static async open(path, baudRate = 115200) {
        return new Promise((resolve, reject) => {
            const port = new SerialPort({
                path,
                baudRate,
                autoOpen: false
            });

            port.open((err) => {
                if (err) {
                    return reject(new Error(`Failed to open port: ${err.message}`));
                }

                // Send MSP_API_VERSION (command 1)
                const packet = MSP.encode(1);
                port.write(packet);

                resolve(new Connection(port));
            });
        });
    }

    /**
     * Switches to CLI text mode by sending '#' character.
     * In CLI mode, raw text data is emitted as 'cli-data' events.
     */
    async enterCliMode() {
        this.port.write(Buffer.from('#'));
        this.port.on('data', (data) => {
            this.emit('cli-data', data.toString());
        });
    }
}
