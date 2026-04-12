import FlyCliError from './FlyCliError.js';

/**
 * Thrown when the device connection is lost unexpectedly.
 * @extends FlyCliError
 */
export default class ConnectionError extends FlyCliError {}
