import { Command } from 'commander';
import AgentWorkflowService from '../../application/AgentWorkflowService.js';
import AgentStorage from '../../infrastructure/storage/AgentStorage.js';
import ConsoleLogger from '../../infrastructure/Logger.js';

const agentCommand = new Command('agent')
  .description('Commands for autonomous AI agent continuity and context tracking');

const storage = new AgentStorage();
const service = new AgentWorkflowService(storage);
const logger = new ConsoleLogger();

agentCommand
  .command('log')
  .description('Log an agent action to the local tracking history')
  .argument('<action>', 'Short name or description of the action (e.g. "Create File")')
  .argument('[description...]', 'Detailed description of what was done')
  .option('-r, --role <role>', 'The role or mode the agent is acting as (e.g. DEVELOPER, ARCHITECT)')
  .action(async (action, descriptionArray, options) => {
    try {
      const description = descriptionArray.join(' ');
      await service.logAction(action, description, options.role);
      logger.info('Agent action logged successfully.');
    } catch (err) {
      logger.error('Failed to log agent action:', err.message);
      process.exit(1);
    }
  });

agentCommand
  .command('plan')
  .description('Manage the overarching execution plan')
  .command('set <plan_text>')
  .description('Set the current execution plan for context recovery')
  .action(async (planText) => {
    try {
      await service.setPlan(planText);
      logger.info('Agent plan updated successfully.');
    } catch (err) {
      logger.error('Failed to set agent plan:', err.message);
      process.exit(1);
    }
  });

agentCommand
  .command('context')
  .description('Get the current execution plan and recent history context')
  .action(async () => {
    try {
      const summary = await service.getContextSummary();
      // Output directly to stdout so it can be easily read by LLMs without logger prefixes
      process.stdout.write(`${summary}\n`);
    } catch (err) {
      logger.error('Failed to get context:', err.message);
      process.exit(1);
    }
  });

export default agentCommand;
