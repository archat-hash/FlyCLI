import { jest } from '@jest/globals';
import fs from 'fs';

const mockDisconnect = jest.fn().mockResolvedValue();
const mockExecute = jest.fn();

jest.unstable_mockModule('../../src/infrastructure/SerialFlightController.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    disconnect: mockDisconnect,
  })),
}));

jest.unstable_mockModule('../../src/application/commands/ExecuteCliUseCase.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    execute: mockExecute,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/Logger.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
}));

const executeCommand = (await import('../../src/interfaces/cli/execute.js')).default;

describe('executeCommand', () => {
  let stdoutWriteSpy;
  let stderrWriteSpy;

  beforeEach(() => {
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should read commands from file if options.file is provided', async () => {
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('cmd1\ncmd2\n#comment\n\n');
    mockExecute.mockResolvedValue(['res1', 'res2']);

    await executeCommand('COM1', '115200', null, { file: 'test.txt', json: false });

    expect(readFileSyncSpy).toHaveBeenCalledWith('test.txt', 'utf8');
    expect(mockExecute).toHaveBeenCalledWith(['cmd1', 'cmd2']);
    expect(stdoutWriteSpy).toHaveBeenCalledWith('[1] res1\n');
    expect(stdoutWriteSpy).toHaveBeenCalledWith('[2] res2\n');
  });

  it('should print error if no commands provided', async () => {
    await executeCommand('COM1', '115200', null, {});
    expect(stderrWriteSpy).toHaveBeenCalledWith('Error: No command provided.\n');
  });

  it('should handle execute error and disconnect', async () => {
    mockExecute.mockRejectedValue(new Error('test error'));
    await executeCommand('COM1', '115200', 'cmd', {});
    expect(stderrWriteSpy).toHaveBeenCalledWith('Error: test error\n');
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
