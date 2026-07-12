/* eslint-disable */
import { jest } from '@jest/globals';

const mockStart = jest.fn().mockResolvedValue();
const mockStop = jest.fn().mockResolvedValue();

jest.unstable_mockModule('../../src/infrastructure/cad/EnvironmentManager.js', () => ({
  EnvironmentManager: jest.fn().mockImplementation(() => ({
    ensureEnvironmentReady: jest.fn().mockResolvedValue('/path/to/freecad'),
  })),
}));

const mockCadEngineStart = jest.fn();
const mockCadEngineStop = jest.fn();
const mockEngineInstance = {
  process: null,
  start: mockCadEngineStart,
  stop: mockCadEngineStop,
};

jest.unstable_mockModule('../../src/infrastructure/cad/CadEngineProcess.js', () => ({
  CadEngineProcess: jest.fn().mockImplementation(() => mockEngineInstance),
}));

let capturedLazyStart = null;
jest.unstable_mockModule('../../src/infrastructure/ai/McpCadTools.js', () => ({
  McpCadTools: jest.fn().mockImplementation((engine, lazyStart) => {
    capturedLazyStart = lazyStart;
    return {};
  }),
}));

jest.unstable_mockModule('../../src/infrastructure/mcp/McpServer.js', () => ({
  McpServerAdapter: jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
  })),
}));

jest.unstable_mockModule('../../src/infrastructure/Logger.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

const cadCommand = (await import('../../src/interfaces/cli/cad.js')).default;

describe('cadCommand', () => {
  let stderrWriteSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
  });

  afterEach(() => {
    stderrWriteSpy.mockRestore();
  });

  it('should start MCP server and wait for exit', async () => {
    // We mock process.on to immediately simulate a SIGINT so it exits
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, cb) => {
      if (event === 'SIGINT') {
        setTimeout(cb, 10);
      }
    });

    const cadPromise = cadCommand();

    /*
     * Simulate invoking lazyStart to get coverage on cad.js 30-37
     * Must wait for start to get assigned
     */
    await new Promise((r) => setTimeout(r, 0));
    if (capturedLazyStart) {
      await capturedLazyStart();
      // calling it twice hits the startPromise caching branch
      await capturedLazyStart();
    }

    await cadPromise;

    expect(mockStart).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
    processOnSpy.mockRestore();
  });

  it('should handle errors during start', async () => {
    mockStart.mockRejectedValueOnce(new Error('test error'));

    await cadCommand();

    expect(stderrWriteSpy).toHaveBeenCalledWith(expect.stringContaining('test error'));
    expect(mockStop).toHaveBeenCalled();
  });

  it('lazyStart should return early if engine.process is true', async () => {
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, cb) => {
      if (event === 'SIGINT') {
        setTimeout(cb, 10);
      }
    });

    mockEngineInstance.process = true;

    const cadPromise = cadCommand();
    await new Promise((r) => setTimeout(r, 0));

    if (capturedLazyStart) {
      await capturedLazyStart();
    }

    await cadPromise;
    expect(mockCadEngineStart).not.toHaveBeenCalled();
    processOnSpy.mockRestore();
    mockEngineInstance.process = null; // reset
  });
});
