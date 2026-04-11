import ExecuteCliUseCase from './ExecuteCliUseCase.js';

export default class GetHealthCheckUseCase {
  constructor(flightController) {
    this.controller = flightController;
    this.executeUseCase = new ExecuteCliUseCase(this.controller);
  }

  async execute() {
    const report = {
      timestamp: new Date().toISOString(),
      version: null,
      status: null,
      tasks: [],
      errors: [],
    };

    const tryExecute = async (cmd) => {
      try {
        return await this.executeUseCase.execute(cmd);
      } catch (error) {
        report.errors.push(`Error executing '${cmd}': ${error.message}`);
        return null;
      }
    };

    // 1. Get Version
    report.version = await tryExecute('version');

    // 2. Get Status
    report.status = await tryExecute('status');

    // 3. Get Tasks
    const tasksOutput = await tryExecute('tasks');
    if (tasksOutput) {
      report.tasks = tasksOutput.split('\n');
    }

    return report;
  }
}
