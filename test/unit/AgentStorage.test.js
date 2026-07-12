import fs from 'fs-extra';
import path from 'path';
import { jest } from '@jest/globals';
import AgentStorage from '../../src/infrastructure/storage/AgentStorage.js';

describe('AgentStorage', () => {
  let storage;
  const testDir = path.join(process.cwd(), '.test_agent_storage');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    storage = new AgentStorage(testDir);
    storage.storageDir = testDir;
    storage.planFile = path.join(testDir, 'current_plan.md');
    storage.manifestFile = path.join(testDir, 'manifest.json');
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should initialize manifest', async () => {
    await storage.init();
    const manifest = await storage.getManifest();
    expect(manifest.currentFileIndex).toBe(1);
    expect(manifest.files).toContain('agent_workflow_1.jsonl');
  });

  it('should save and get plan', async () => {
    await storage.setPlan('My Plan');
    const plan = await storage.getPlan();
    expect(plan).toBe('My Plan');

    // Missing plan
    await fs.remove(storage.planFile);
    const missing = await storage.getPlan();
    expect(missing).toBeNull();
  });

  it('should log action and get recent actions', async () => {
    await storage.logAction({ action: 'think' });
    await storage.logAction({ action: 'act' });

    const actions = await storage.getRecentActions(10);
    expect(actions.length).toBe(2);
    expect(actions[0].action).toBe('think');
    expect(actions[1].action).toBe('act');
  });

  it('should break early if count is reached', async () => {
    await storage.logAction({ action: '1' });
    await storage.logAction({ action: '2' });

    const actions = await storage.getRecentActions(1);
    expect(actions.length).toBe(1);
    expect(actions[0].action).toBe('2');
  });

  it('should rotate files when max size is reached', async () => {
    await storage.init();

    const originalStat = fs.stat;
    fs.stat = jest.fn().mockResolvedValue({ size: 2 * 1024 * 1024 });

    await storage.logAction({ action: 'test' });

    const manifest = await storage.getManifest();
    expect(manifest.currentFileIndex).toBe(2);
    expect(manifest.files).toContain('agent_workflow_2.jsonl');

    fs.stat = originalStat;
  });
});
