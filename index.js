#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './src/commands/scan.js';
import { executeCommand } from './src/commands/execute.js';

const program = new Command();

program
    .name('flycli')
    .description('CLI tool for Betaflight flight controller interaction')
    .version('1.0.0');

program
    .command('scan')
    .description('Scan and list available serial ports')
    .option('--json', 'Output as JSON')
    .action(scanCommand);

program
    .command('execute')
    .description('Execute a CLI command on the flight controller')
    .argument('<port>', 'Serial port path (e.g. /dev/tty.usbmodem1)')
    .argument('<baud>', 'Baud rate (e.g. 115200)')
    .argument('<cmd>', 'CLI command to execute (e.g. "diff all")')
    .option('--json', 'Output as JSON')
    .action(executeCommand);

program.parse();
