export default class ListPortsUseCase {
  #scanner;

  constructor(portScanner) {
    this.#scanner = portScanner;
  }

  async execute() {
    return this.#scanner.listPorts();
  }
}
