export default class ListPortsUseCase {
  constructor(portScanner) {
    this.scanner = portScanner;
  }

  async execute() {
    return this.scanner.listPorts();
  }
}
