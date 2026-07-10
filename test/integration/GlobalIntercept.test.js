import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

describe('Global CLI Execution Intercept (Interface Decoration)', () => {
  const cliPath = path.join(process.cwd(), 'index.js');
  const storageDir = path.join(process.cwd(), '.flycli', 'agent_logs');
  const manifestFile = path.join(storageDir, 'manifest.json');

  beforeAll(async () => {
    // Clear logs to ensure clean slate
    await fs.remove(storageDir);
  });

  afterAll(async () => {
    await fs.remove(storageDir);
  });

  it('should intercept and log "node index.js --version" execution', async () => {
    // Execute command
    execSync(`node ${cliPath} --version`);

    // Verify manifest exists
    expect(fs.existsSync(manifestFile)).toBe(true);

    const manifest = await fs.readJson(manifestFile);
    expect(manifest.files.length).toBeGreaterThan(0);

    const lastLogFile = path.join(storageDir, manifest.files[manifest.files.length - 1]);
    const logContent = await fs.readFile(lastLogFile, 'utf-8');

    // Verify it contains the version command
    expect(logContent).toContain('CLI Execution');
    expect(logContent).toContain('--version');
  });

  it('should not redundantly log "node index.js agent context" to avoid infinite loops', async () => {
    // Count current lines
    const lastLogFile = path.join(storageDir, 'agent_workflow_1.jsonl');
    const initialLines = (await fs.readFile(lastLogFile, 'utf-8')).trim().split('\n').length;

    // Execute agent context
    execSync(`node ${cliPath} agent context`);

    const finalLines = (await fs.readFile(lastLogFile, 'utf-8')).trim().split('\n').length;

    // Should exactly be the same, meaning no new logs were appended by the interceptor
    expect(finalLines).toBe(initialLines);
  });
});
