import Connection from '../core/connection.js';

const CLI_PROMPT = '# ';
const CLI_TIMEOUT_MS = 5000;

export async function executeCommand(port, baudRate, cmd, options) {
    let conn = null;
    try {
        conn = await Connection.open(port, parseInt(baudRate, 10));

        const output = await new Promise((resolve, reject) => {
            let promptBuffer = '';
            let responseBuffer = '';
            let commandSent = false;
            let responseTimer = null;

            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for CLI response after ${CLI_TIMEOUT_MS}ms`));
            }, CLI_TIMEOUT_MS);

            conn.on('cli-data', (data) => {
                if (!commandSent) {
                    // Accumulate data until we see the CLI prompt
                    promptBuffer += data;
                    if (promptBuffer.includes(CLI_PROMPT)) {
                        commandSent = true;
                        conn.port.write(`${cmd}\n`);

                        // Start collecting response after sending command
                        responseTimer = setTimeout(() => {
                            clearTimeout(timer);
                            resolve(responseBuffer);
                        }, 500);
                    }
                } else {
                    // Collect response data after command was sent
                    responseBuffer += data;
                }
            });

            conn.enterCliMode();
        });

        if (options.json) {
            console.log(JSON.stringify({ command: cmd, output }));
        } else {
            console.log(output);
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
    } finally {
        // Always close the port to release the resource
        if (conn && conn.port) {
            conn.port.close(() => { });
        }
    }
}
