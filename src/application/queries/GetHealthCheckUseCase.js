import ExecuteCliUseCase from '../commands/ExecuteCliUseCase.js';

/**
 * Query to get comprehensive health status of the flight controller.
 */
export default class GetHealthCheckUseCase {
  #controller;

  #executeUseCase;

  constructor(flightController, logger) {
    this.#controller = flightController;
    this.#executeUseCase = new ExecuteCliUseCase(this.#controller, logger);
  }

  /**
   * Executes the health check query.
   * @returns {Promise<Object>} The health report.
   */
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
        return await this.#executeUseCase.execute(cmd);
      } catch (error) {
        report.errors.push(`Error executing '${cmd}': ${error.message}`);
        return null;
      }
    };

    report.version = await tryExecute('version');
    report.status = await tryExecute('status');

    const tasksOutput = await tryExecute('tasks');
    if (tasksOutput) {
      report.tasks = tasksOutput.split('\n');
    }

    return report;
  }
}
