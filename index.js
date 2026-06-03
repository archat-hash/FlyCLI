#!/usr/bin/env node

import { Command } from 'commander';
import scanCommand from './src/interfaces/cli/scan.js';
import executeCommand from './src/interfaces/cli/execute.js';
import healthCommand from './src/interfaces/cli/health.js';
import contextCommand from './src/interfaces/cli/context.js';
import wizardCommand from './src/interfaces/cli/wizard.js';
import cadCommand from './src/interfaces/cli/cad.js';

const program = new Command();

program
  .name('flycli')
  .description('CLI tool for Betaflight flight controller interaction')
  .version('1.2.0');

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
  .argument('[cmd]', 'CLI command to execute (e.g. "diff all")')
  .option('--json', 'Output as JSON')
  .option('-f, --file <path>', 'Path to a file containing CLI commands')
  .action(executeCommand);

program
  .command('health')
  .description('Perform a quick health check of the flight controller')
  .argument('<port>', 'Serial port path')
  .argument('[baud]', 'Baud rate', '115200')
  .option('--json', 'Output as JSON')
  .action(healthCommand);

program
  .command('context')
  .description('Get machine-readable or human-readable context about FlyCLI')
  .argument('[topic]', 'Specific context topic to retrieve (e.g., commands, safety)')
  .option('--json', 'Output as JSON for AI Agents')
  .action(contextCommand);

program
  .command('wizard')
  .description('Run an interactive setup wizard (Human-in-the-Loop)')
  .argument('<type>', 'Wizard type: rx (RC calibration)')
  .argument('<port>', 'Serial port path (e.g. /dev/tty.usbmodem1 or COM3)')
  .argument('[baud]', 'Baud rate', '115200')
  .option('--json', 'Output final result as JSON for AI Agents')
  .action(wizardCommand);

program
  .command('cad')
  .description('Start an interactive AI-powered CAD session with FreeCAD')
  .argument('<prompt>', 'Natural-language description of the 3D model (e.g. "Make a drone frame")')
  .action(cadCommand);

program.parse();
