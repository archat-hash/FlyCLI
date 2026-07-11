import fs from 'fs-extra';
import path from 'path';
import { jest } from '@jest/globals';
import AgentStorage from '../../src/infrastructure/storage/AgentStorage.js';
import AgentWorkflowService from '../../src/application/AgentWorkflowService.js';

describe('AgentWorkflowService', () => {
  const testDir = path.join(process.cwd(), '.test_agent_storage');
  let service;

  beforeEach(async () => {
    await fs.remove(testDir);
    const storage = new AgentStorage(testDir);
    /*
     * override the hardcoded storageDir just for testing if needed
     * Actually AgentStorage uses projectRoot + '.flycli'
     */
    storage.storageDir = path.join(testDir, '.flycli', 'agent_logs');
    storage.planFile = path.join(storage.storageDir, 'current_plan.md');
    storage.manifestFile = path.join(storage.storageDir, 'manifest.json');
    service = new AgentWorkflowService(storage);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  test('should log an action and retrieve it', async () => {
    await service.logAction('TEST_ACTION', 'This is a test action', 'DEVELOPER');

    const summary = await service.getContextSummary();
    expect(summary).toContain('TEST_ACTION');
    expect(summary).toContain('This is a test action');
    expect(summary).toContain('[DEVELOPER]');
  });

  test('should set and get the plan', async () => {
    const planText = '# Test Plan\n- Step 1\n- Step 2';
    await service.setPlan(planText);

    const summary = await service.getContextSummary();
    expect(summary).toContain('# Test Plan');
    expect(summary).toContain('- Step 1');
  });

  test('should rotate logs if file size exceeds limit', async () => {
    const originalStat = fs.stat;
    fs.stat = jest.fn().mockImplementation(async () => ({ size: 1024 * 1024 * 2 }));
    await service.logAction('ACTION_1');
    await service.logAction('ACTION_2');

    const manifest = await fs.readJson(service.storage.manifestFile);
    // Because stat returns 2MB, it rotates EVERY time it logs
    expect(manifest.files.length).toBeGreaterThan(1);

    fs.stat = originalStat;
  });
});
