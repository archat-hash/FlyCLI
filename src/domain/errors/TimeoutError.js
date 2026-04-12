import FlyCliError from './FlyCliError.js';

/**
 * Thrown when a CLI command times out waiting for a response.
 * @extends FlyCliError
 */
export default class TimeoutError extends FlyCliError {}
