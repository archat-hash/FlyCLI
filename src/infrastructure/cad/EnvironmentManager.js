import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Manages the lifecycle of the portable FreeCAD environment.
 * @implements {IEnvironmentManager}
 */
export class EnvironmentManager {
  constructor(logger = console) {
    this.logger = logger;
    this.defaultPaths = [
      process.env.FREECAD_PATH,
      'C:\\Program Files\\FreeCAD 0.21\\bin\\FreeCAD.exe',
      'C:\\Program Files\\FreeCAD 0.20\\bin\\FreeCAD.exe',
      'C:\\Program Files\\FreeCAD 1.0\\bin\\FreeCAD.exe',
      '/usr/bin/freecad',
      '/Applications/FreeCAD.app/Contents/MacOS/FreeCAD'
    ];
  }

  /**
   * Checks for the environment, downloads it if necessary.
   * @returns {Promise<string>} Absolute path to the FreeCAD.exe executable.
   */
  async ensureEnvironmentReady() {
    this.logger.info('Checking for FreeCAD installation...');
    
    // Check known paths
    for (const p of this.defaultPaths) {
      if (p) {
        try {
          const stats = await fs.stat(p);
          if (stats.isFile()) {
            this.logger.info(`Found FreeCAD at: ${p}`);
            return p;
          }
        } catch (e) {
          // File not found, try next
        }
      }
    }

    // Auto-download logic will be implemented here later
    // For MVP, we throw an error asking the user to set the env var
    throw new Error(
      'FreeCAD installation not found. Please install FreeCAD and set FREECAD_PATH environment variable, ' +
      'or wait for the auto-download feature to be implemented.'
    );
  }

  /**
   * Returns current status.
   * @returns {Object}
   */
  getStatus() {
    return { status: 'ready', progress: 100 };
  }
}
