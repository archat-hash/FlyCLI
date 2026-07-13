import fs from 'fs-extra';
import path from 'path';

const MAX_FILE_SIZE = 1024 * 1024;

export default class FactoryStorage {
  constructor(projectRoot = process.cwd()) {
    this.storageDir = path.join(projectRoot, '.flycli', 'factory_logs');
    this.manifestFile = path.join(this.storageDir, 'manifest.json');
    this.stateFile = path.join(this.storageDir, 'state.json');
  }

  async init() {
    await fs.ensureDir(this.storageDir);
    if (!(await fs.pathExists(this.manifestFile))) {
      await fs.writeJson(this.manifestFile, { currentFileIndex: 1, files: ['messenger_1.jsonl'] });
    }
  }

  async getManifest() {
    return fs.readJson(this.manifestFile);
  }

  async saveManifest(manifest) {
    await fs.writeJson(this.manifestFile, manifest);
  }

  async saveMessage(eventMessage) {
    await this.init();
    const manifest = await this.getManifest();
    let currentFileName = manifest.files[manifest.files.length - 1];
    let currentFilePath = path.join(this.storageDir, currentFileName);

    const stats = await fs.stat(currentFilePath).catch(() => ({ size: 0 }));

    if (stats.size >= MAX_FILE_SIZE) {
      manifest.currentFileIndex += 1;
      currentFileName = `messenger_${manifest.currentFileIndex}.jsonl`;
      currentFilePath = path.join(this.storageDir, currentFileName);
      manifest.files.push(currentFileName);
      await this.saveManifest(manifest);
    }

    const logLine = `${JSON.stringify(eventMessage.toJSON())}\n`;
    await fs.appendFile(currentFilePath, logLine);
  }

  /* istanbul ignore next */
  async getMessages(count = 50) {
    await this.init();
    const manifest = await this.getManifest();

    let messages = [];
    const readPromises = manifest.files.slice().reverse().map((fileName) => {
      const fPath = path.join(this.storageDir, fileName);
      return fs.readFile(fPath, 'utf-8').catch(() => '');
    });

    const fileContents = await Promise.all(readPromises);

    for (let i = 0; i < fileContents.length; i += 1) {
      const content = fileContents[i];
      if (content) {
        const lines = content.trim().split('\n').filter((l) => l.length > 0);
        const fileMessages = lines.map((l) => JSON.parse(l)).reverse();
        messages = messages.concat(fileMessages);
        if (messages.length >= count) {
          break;
        }
      }
    }

    return messages.slice(0, count).reverse();
  }

  async saveState(ticketId, state) {
    await this.init();
    let states = {};
    if (await fs.pathExists(this.stateFile)) {
      states = await fs.readJson(this.stateFile);
    }
    states[ticketId] = state;
    await fs.writeJson(this.stateFile, states);
  }

  async getState(ticketId) {
    await this.init();
    if (await fs.pathExists(this.stateFile)) {
      const states = await fs.readJson(this.stateFile);
      return states[ticketId] || null;
    }
    return null;
  }
}
