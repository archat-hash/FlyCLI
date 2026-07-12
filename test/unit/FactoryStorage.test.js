import fs from 'fs-extra';
import path from 'path';
import { jest } from '@jest/globals';
import FactoryStorage from '../../src/infrastructure/storage/FactoryStorage.js';
import EventMessage from '../../src/domain/factory/EventMessage.js';

describe('FactoryStorage', () => {
  let storage;
  const testDir = path.join(process.cwd(), '.test_factory_storage');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    storage = new FactoryStorage(testDir);
    // Overwrite internal path to test dir
    storage.storageDir = testDir;
    storage.manifestFile = path.join(testDir, 'manifest.json');
    storage.stateFile = path.join(testDir, 'state.json');
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should initialize manifest', async () => {
    await storage.init();
    const manifest = await storage.getManifest();
    expect(manifest.currentFileIndex).toBe(1);
    expect(manifest.files).toContain('messenger_1.jsonl');
  });

  it('should save and get state', async () => {
    await storage.saveState('epic1', 'DRAFT');
    const state = await storage.getState('epic1');
    expect(state).toBe('DRAFT');

    const missingState = await storage.getState('missing');
    expect(missingState).toBeNull();
  });

  it('should save and get messages', async () => {
    const msg1 = new EventMessage({ senderRole: 'Developer', content: 'hello' });
    const msg2 = new EventMessage({ senderRole: 'QA', content: 'world' });

    await storage.saveMessage(msg1);
    await storage.saveMessage(msg2);

    const msgs = await storage.getMessages(10);
    expect(msgs.length).toBe(2);
    expect(msgs[0].content).toBe('hello');
    expect(msgs[1].content).toBe('world');
  });

  it('should rotate files when max size is reached', async () => {
    await storage.init();

    // We will spoof the fs.stat to return a large size
    const originalStat = fs.stat;
    fs.stat = jest.fn().mockResolvedValue({ size: 2 * 1024 * 1024 });

    const msg = new EventMessage({ senderRole: 'Dev', content: 'test' });
    await storage.saveMessage(msg);

    const manifest = await storage.getManifest();
    expect(manifest.currentFileIndex).toBe(2);
    expect(manifest.files).toContain('messenger_2.jsonl');

    fs.stat = originalStat;
  });

  it('should break early if count is reached', async () => {
    const msg1 = new EventMessage({ senderRole: 'Dev', content: '1' });
    const msg2 = new EventMessage({ senderRole: 'QA', content: '2' });
    await storage.saveMessage(msg1);
    await storage.saveMessage(msg2);

    const msgs = await storage.getMessages(1);
    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe('2');
  });

  it('should update existing state file', async () => {
    await storage.saveState('epic1', 'DRAFT');
    await storage.saveState('epic2', 'DONE');

    const state1 = await storage.getState('epic1');
    const state2 = await storage.getState('epic2');

    expect(state1).toBe('DRAFT');
    expect(state2).toBe('DONE');
  });

  it('should return null when getting state and state file does not exist', async () => {
    // Delete the state file just in case
    await fs.remove(storage.stateFile);
    const state = await storage.getState('any');
    expect(state).toBeNull();
  });
});
