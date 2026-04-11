import SerialFlightController from '../infrastructure/SerialFlightController.js';
import GetHealthCheckUseCase from '../application/GetHealthCheckUseCase.js';

/**
 * Performs a health check on the flight controller.
 * @param {string} port
 * @param {string} baudRate
 * @param {Object} options
 */
export default async function getHealth(port, baudRate, options) {
  const controller = new SerialFlightController(port, parseInt(baudRate, 10));
  const useCase = new GetHealthCheckUseCase(controller);

  try {
    const report = await useCase.execute();

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('\n🚁 FlyCLI Health Report');
      console.log('-----------------------');
      console.log(`Time: ${report.timestamp}`);
      console.log(`Version: ${report.version?.split('\n')[0] || 'Unknown'}`);
      console.log(`Status Highlights: ${report.status?.split('\n')[1] || 'N/A'}`);
      console.log(`Tasks: ${report.tasks.length} tasks running`);

      if (report.errors.length > 0) {
        console.log('\n⚠️ Errors:');
        report.errors.forEach((err) => console.log(`- ${err}`));
      }
      console.log('\nUse --json for full details.');
    }
  } catch (err) {
    console.error(`Error performing health check: ${err.message}`);
  }
}
