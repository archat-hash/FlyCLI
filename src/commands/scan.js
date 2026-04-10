import Scanner from '../core/scanner.js';

export async function scanCommand(options) {
    try {
        const ports = await Scanner.listPorts();
        if (options.json) {
            console.log(JSON.stringify(ports, null, 2));
        } else {
            if (ports.length === 0) {
                console.log('No serial ports found.');
                return;
            }
            console.log('Available ports:');
            ports.forEach((port) => {
                const info = [port.path, port.manufacturer, port.vendorId ? `VID:${port.vendorId}` : ''].filter(Boolean).join(' | ');
                console.log(`  ${info}`);
            });
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}
