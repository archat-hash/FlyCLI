import PortScanner from '../../infrastructure/PortScanner.js';
import ListPortsUseCase from '../../application/queries/ListPortsUseCase.js';

/**
 * Scan for available serial ports and display them.
 */
export default async function scanPorts(options) {
  const scanner = new PortScanner();
  const useCase = new ListPortsUseCase(scanner);

  try {
    const ports = await useCase.execute();

    if (options.json) {
      console.log(JSON.stringify(ports, null, 2));
      return;
    }

    if (ports.length === 0) {
      console.log('No serial ports found.');
      return;
    }

    console.log('\nAvailable serial ports:');
    console.log('-----------------------');

    ports.forEach((port) => {
      const marker = port.isLikelyBetaflight ? '🚀 [Likely Betaflight]' : '  ';
      console.log(`${marker} ${port.path}`);
      console.log(`   Manufacturer: ${port.manufacturer}`);
      if (port.vendorId) console.log(`   VID: ${port.vendorId} PID: ${port.productId}`);
      console.log('');
    });

    const likely = ports.filter((p) => p.isLikelyBetaflight);
    if (likely.length > 0) {
      console.log(`\nFound ${likely.length} likely Betaflight device(s).`);
      console.log('Use one of these paths with the execute command, e.g.:');
      console.log(`  flycli execute ${likely[0].path} status`);
    } else {
      console.log('\nNo obvious Betaflight devices found. Check your connection.');
    }
  } catch (error) {
    console.error(`Error scanning ports: ${error.message}`);
  }
}
