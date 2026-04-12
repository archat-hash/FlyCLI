/**
 * Base error class for all FlyCLI domain errors.
 * @extends Error
 */
export default class FlyCliError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
