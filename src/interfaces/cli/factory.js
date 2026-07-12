import readline from 'readline';
import ConsoleLogger from '../../infrastructure/Logger.js';
import FactoryStorage from '../../infrastructure/storage/FactoryStorage.js';
import MessengerService from '../../application/factory/MessengerService.js';
import FactoryOrchestrator from '../../application/factory/FactoryOrchestrator.js';

export function buildFactoryDependencies() {
  const storage = new FactoryStorage();
  const messenger = new MessengerService(storage);
  const orchestrator = new FactoryOrchestrator(storage, messenger);
  return { storage, messenger, orchestrator };
}

async function handleInit(orchestrator, epicName) {
  const logger = new ConsoleLogger();
  if (!epicName) {
    logger.error('Usage: flycli factory init <epicName>');
    return;
  }
  try {
    const state = await orchestrator.startEpic(epicName);
    logger.info(`Started Epic: ${epicName} in state ${state}`);
  } catch (err) {
    logger.error(err.message);
  }
}

async function handleStatus(orchestrator, epicName) {
  const logger = new ConsoleLogger();
  if (!epicName) {
    logger.error('Usage: flycli factory status <epicName>');
    return;
  }
  const state = await orchestrator.getStatus(epicName);
  if (state) {
    logger.info(`Epic ${epicName} is currently in state: ${state}`);
  } else {
    logger.error(`Epic ${epicName} not found.`);
  }
}

async function handleChatPauseMenu(rl, messenger, epicName, loopCallback) {
  console.log('\n--- PAUSED ---');
  console.log('1. [Hint] Add a message to the chat');
  console.log('2. [Edit Roles] Update System Prompts');
  console.log('3. [Resume] Continue');

  rl.question('Select an option (1-3): ', async (option) => {
    if (option === '1') {
      rl.question('Enter your message: ', async (msg) => {
        await messenger.postMessage({ senderRole: 'Boss', content: msg, ticketId: epicName });
        console.log('Message posted.');
        loopCallback();
      });
    } else if (option === '2') {
      console.log('Role editing not implemented yet.');
      loopCallback();
    } else {
      console.log('Resuming...');
      loopCallback();
    }
  });
}

async function handleChat(messenger, epicName) {
  const logger = new ConsoleLogger();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  logger.info(`Starting interactive factory chat for epic: ${epicName}`);
  logger.info('Type [PAUSE] at any time to interrupt and enter the menu.');

  /*
   * Real implementation would tail the messenger storage or use an event emitter.
   * For now, we simulate the chat loop.
   */
  const context = await messenger.getChatContext(20);
  console.log(context);

  const loop = () => {
    rl.question('>> ', async (input) => {
      const text = input.trim();
      if (text === '[PAUSE]') {
        await handleChatPauseMenu(rl, messenger, epicName, loop);
      } else if (text.toLowerCase() === 'exit') {
        rl.close();
      } else {
        if (text) await messenger.postMessage({ senderRole: 'Boss', content: text, ticketId: epicName });
        loop();
      }
    });
  };

  loop();
}

async function handleRead(messenger) {
  const context = await messenger.getChatContext(50);
  console.log(context);
}

async function handlePost(messenger, orchestrator, epicName, role, message) {
  await messenger.postMessage({ senderRole: role, content: message, ticketId: epicName });
  console.log('Message posted.');
}

async function handleAttach(messenger, orchestrator, epicName, role, filePath, message) {
  await messenger.postMessage({
    senderRole: role, content: message, ticketId: epicName, artifacts: [filePath],
  });
  console.log(`Message with attachment ${filePath} posted.`);
}

export default async function factoryCommand(args) {
  const { messenger, orchestrator } = buildFactoryDependencies();
  const logger = new ConsoleLogger();

  const command = args[0];
  const epicName = args[1] || 'global';

  const handlers = {
    init: () => handleInit(orchestrator, epicName),
    status: () => handleStatus(orchestrator, epicName),
    chat: () => handleChat(messenger, epicName),
    read: () => handleRead(messenger),
    post: () => handlePost(messenger, orchestrator, epicName, args[2], args.slice(3).join(' ')),
    attach: () => handleAttach(messenger, orchestrator, epicName, args[2], args[3], args.slice(4).join(' ')),
  };

  if (handlers[command]) {
    await handlers[command]();
  } else {
    logger.info('Usage: flycli factory <init|status|chat|read|post|attach> [epicName] [role] [filePath] [message]');
  }
}
