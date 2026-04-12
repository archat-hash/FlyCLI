/**
 * Query to list all available flight controller ports.
 */
export default class ListPortsUseCase {
  #scanner;

  constructor(portScanner) {
    this.#scanner = portScanner;
  }

  /**
   * Executes the list ports query.
   * @returns {Promise<Array>} List of ports.
   */
  async execute() {
    return this.#scanner.listPorts();
  }
}
