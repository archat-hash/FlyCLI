export const CONTEXT_KNOWLEDGE_BASE = {
  commands: `
## Available Commands
- \`flycli scan\` : Search for connected flight controllers.
- \`flycli execute <port> <baud> "<command>"\` : Execute a CLI command.
- \`flycli health <port> [baud]\` : Complete system checkup.
`,
  safety: `
## Important Warnings and Safety
- ALWAYS remove props before connecting the drone.
- Never run \`defaults\` command when connected to a battery.
`,
};

export class GetContextQuery {
  /**
   * @param {Object} knowledgeBase - The knowledge base mapping
   */
  constructor(knowledgeBase = CONTEXT_KNOWLEDGE_BASE) {
    this.knowledgeBase = knowledgeBase;
  }

  /**
   * Executes the query to fetch context information.
   * @param {string} [topic] - The specific context topic to retrieve.
   * @returns {Object} Context data or error object.
   */
  execute(topic) {
    if (!topic) {
      return { topics: Object.keys(this.knowledgeBase) };
    }
    const content = this.knowledgeBase[topic];
    if (!content) {
      return { error: `Topic not found: ${topic}. Available topics: ${Object.keys(this.knowledgeBase).join(', ')}` };
    }
    return { topic, content: content.trim() };
  }
}
