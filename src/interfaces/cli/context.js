import { GetContextQuery } from '../../application/GetContextQuery.js';

function printTextResult(result) {
  if (result.error) {
    console.error(`❌ ${result.error}`);
    process.exit(1);
  }

  if (result.topics) {
    console.log('📚 Available Context Topics:');
    result.topics.forEach((t) => console.log(`  - ${t}`));
    console.log('\nUse: flycli context <topic> [--json]');
    return;
  }

  console.log(`\n📘 Context: ${result.topic.toUpperCase()}`);
  console.log('--------------------------------------------------');
  console.log(result.content);
  console.log('--------------------------------------------------\n');
}

/**
 * CLI Handler for the "context" command.
 * @param {string} topic - The topic to get context for.
 * @param {Object} options - Commander options.
 */
export default function contextCommand(topic, options) {
  try {
    const query = new GetContextQuery();
    const result = query.execute(topic);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    printTextResult(result);
  } catch (err) {
    if (options.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(`❌ Unexpected Error: ${err.message}`);
    }
    process.exit(1);
  }
}
