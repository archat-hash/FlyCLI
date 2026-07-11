import fs from 'fs-extra';
import path from 'path';

const MAX_FILE_SIZE = 1024 * 1024;

export default class AgentStorage {
  constructor(projectRoot = process.cwd()) {
    this.storageDir = path.join(projectRoot, '.flycli', 'agent_logs');
    this.planFile = path.join(this.storageDir, 'current_plan.md');
    this.manifestFile = path.join(this.storageDir, 'manifest.json');
  }

  async init() {
    await fs.ensureDir(this.storageDir);
    if (!(await fs.pathExists(this.manifestFile))) {
      await fs.writeJson(this.manifestFile, { currentFileIndex: 1, files: ['agent_workflow_1.jsonl'] });
    }
  }

  async getManifest() {
    return fs.readJson(this.manifestFile);
  }

  async saveManifest(manifest) {
    await fs.writeJson(this.manifestFile, manifest);
  }

  async logAction(actionEntry) {
    await this.init();
    const manifest = await this.getManifest();
    let currentFileName = manifest.files[manifest.files.length - 1];
    let currentFilePath = path.join(this.storageDir, currentFileName);

    const stats = await fs.stat(currentFilePath).catch(() => ({ size: 0 }));

    if (stats.size >= MAX_FILE_SIZE) {
      manifest.currentFileIndex += 1;
      currentFileName = `agent_workflow_${manifest.currentFileIndex}.jsonl`;
      currentFilePath = path.join(this.storageDir, currentFileName);
      manifest.files.push(currentFileName);
      await this.saveManifest(manifest);
    }

    const logLine = `${JSON.stringify({ ...actionEntry, timestamp: new Date().toISOString() })}\n`;
    await fs.appendFile(currentFilePath, logLine);
  }

  async setPlan(planText) {
    await this.init();
    await fs.writeFile(this.planFile, planText, 'utf-8');
  }

  async getPlan() {
    await this.init();
    try {
      return await fs.readFile(this.planFile, 'utf-8');
    } catch (e) {
      return null;
    }
  }

  async getRecentActions(count = 10) {
    await this.init();
    const manifest = await this.getManifest();

    let actions = [];
    const readPromises = manifest.files.slice().reverse().map((fileName) => {
      const fPath = path.join(this.storageDir, fileName);
      return fs.readFile(fPath, 'utf-8').catch(() => '');
    });

    const fileContents = await Promise.all(readPromises);

    for (let i = 0; i < fileContents.length; i += 1) {
      const content = fileContents[i];
      if (content) {
        const lines = content.trim().split('\n').filter((l) => l.length > 0);
        const fileActions = lines.map((l) => JSON.parse(l)).reverse();
        actions = actions.concat(fileActions);
        if (actions.length >= count) {
          break;
        }
      }
    }

    return actions.slice(0, count).reverse();
  }
}
