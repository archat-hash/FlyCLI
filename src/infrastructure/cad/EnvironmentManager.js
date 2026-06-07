import fs from 'fs/promises';
import path from 'path';

/**
 * @module EnvironmentManager
 * @description Manages the lifecycle of the portable FreeCAD environment.
 *   Searches known installation paths and validates executable presence.
 *
 * Traceability:
 *   - Interface: ddd_interfaces.md § IEnvironmentManager
 *   - Architecture: implementation_plan.md § EnvironmentManager
 *   - CQRS: ensureEnvironmentReady [Command/Query hybrid — resolves path, validates FS]
 *           getStatus [Query]
 */

const WINDOWS_PATHS = [
  'C:\\Program Files\\FreeCAD 0.21\\bin\\FreeCAD.exe',
  'C:\\Program Files\\FreeCAD 0.20\\bin\\FreeCAD.exe',
  'C:\\Program Files\\FreeCAD 1.0\\bin\\FreeCAD.exe',
  // Per-user installations
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'FreeCAD 1.0', 'bin', 'freecad.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'FreeCAD 0.21', 'bin', 'freecad.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'FreeCAD 0.22', 'bin', 'freecad.exe'),
];

const UNIX_PATHS = [
  '/usr/bin/freecad',
  '/Applications/FreeCAD.app/Contents/MacOS/FreeCAD',
];

/**
 * Builds the list of candidate paths to check, including the env override.
 * @returns {string[]}
 */
function buildCandidatePaths() {
  const envPath = process.env.FREECAD_PATH;
  const base = [...WINDOWS_PATHS, ...UNIX_PATHS];
  return envPath ? [envPath, ...base] : base;
}

/**
 * Checks whether a file exists at the given path.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Finds the first existing FreeCAD executable from the candidate list.
 * @param {string[]} candidates
 * @returns {Promise<string|null>}
 */
async function findExecutable(candidates) {
  const checks = candidates.map((p) => fileExists(p).then((ok) => (ok ? p : null)));
  const results = await Promise.all(checks);
  return results.find((p) => p !== null) ?? null;
}

/**
 * Manages the lifecycle of the portable FreeCAD environment.
 * @implements {IEnvironmentManager}
 */
export class EnvironmentManager {
  /**
   * @param {object} logger
   */
  constructor(logger = console) {
    this.logger = logger;
  }

  /**
   * Checks for the environment; throws if not found.
   * @returns {Promise<string>} Absolute path to the FreeCAD executable.
   * @throws {Error} If no FreeCAD installation is found.
   */
  async ensureEnvironmentReady() {
    this.logger.info('Checking for FreeCAD installation...');
    const candidates = buildCandidatePaths();
    const found = await findExecutable(candidates);

    if (!found) {
      throw new Error(
        'FreeCAD installation not found. '
        + 'Please install FreeCAD and set the FREECAD_PATH environment variable.',
      );
    }

    this.logger.info(`Found FreeCAD at: ${found}`);
    return found;
  }

  /**
   * Returns current environment status.
   * @returns {{ status: string, progress: number }}
   */
  static getStatus() {
    return { status: 'ready', progress: 100 };
  }
}

export default EnvironmentManager;
