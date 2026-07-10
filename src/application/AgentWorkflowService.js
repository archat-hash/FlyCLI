export default class AgentWorkflowService {
  constructor(storage) {
    if (!storage) throw new Error('storage dependency required');
    this.storage = storage;
  }

  async logAction(actionName, description, role = null) {
    const entry = { action: actionName };
    if (description) entry.description = description;
    if (role) entry.role = role;
    await this.storage.logAction(entry);
  }

  async setPlan(planText) {
    await this.storage.setPlan(planText);
  }

  async getContextSummary() {
    const plan = await this.storage.getPlan();
    const recent = await this.storage.getRecentActions(10);

    let summary = '=== AGENT CONTEXT ===\n\n';
    summary += '## Current Plan:\n';
    summary += plan || 'No plan set. Please define a plan using `flycli agent plan set <text>`.\n';

    summary += '\n## Recent Actions:\n';
    if (recent.length === 0) {
      summary += 'No recent actions logged.\n';
    } else {
      recent.forEach((a, i) => {
        const roleStr = a.role ? `[${a.role}] ` : '';
        const descStr = a.description ? `\n   ${a.description}` : '';
        summary += `${i + 1}. ${roleStr}${a.action} (${a.timestamp})${descStr}\n`;
      });
    }

    return summary;
  }
}
