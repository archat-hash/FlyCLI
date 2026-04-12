/**
 * Console-based logger implementation.
 * Can be replaced with any custom logger via DI.
 */
export default class ConsoleLogger {
  /**
   * @param {string} message
   */
  info(message) {
    console.info(message); // eslint-disable-line no-console
  }

  /**
   * @param {string} message
   */
  log(message) {
    console.log(message); // eslint-disable-line no-console
  }

  /**
   * @param {string} message
   */
  error(message) {
    console.error(message); // eslint-disable-line no-console
  }

  /**
   * @param {string} message
   */
  debug(message) {
    console.debug(message); // eslint-disable-line no-console
  }
}
