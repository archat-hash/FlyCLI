import FlyCliError from './FlyCliError.js';

/**
 * Thrown when a device-level error occurs (e.g. failed to enter CLI mode).
 * @extends FlyCliError
 */
export default class DeviceError extends FlyCliError {}
