import { jest } from '@jest/globals';

// Mock serialport
jest.unstable_mockModule('serialport', () => ({
  SerialPort: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    removeListener: jest.fn(),
    write: jest.fn(),
    open: jest.fn((cb) => cb && cb(null)),
    close: jest.fn((cb) => cb && cb(null)),
    isOpen: true,
    removeAllListeners: jest.fn(),
  })),
}));

const { default: ExecuteCliUseCase } = await import('../../src/application/ExecuteCliUseCase.js');

describe('ExecuteCliUseCase — Reboot Coverage', () => {
  let mockController;
  let useCase;

  beforeEach(() => {
    mockController = {
      buffer: '',
      connect: jest.fn().mockResolvedValue(),
      sendRaw: jest.fn().mockResolvedValue(),
      waitFor: jest.fn().mockResolvedValue(),
      waitForDisconnect: jest.fn().mockResolvedValue(),
      waitForReboot: jest.fn().mockResolvedValue(),
      reset: jest.fn().mockResolvedValue(),
      disconnect: jest.fn().mockResolvedValue(),
      clearBuffer: jest.fn(),
      onData: jest.fn(() => () => { }),
    };
    useCase = new ExecuteCliUseCase(mockController);
  });

  it('should handle "save" command with reboot detection', async () => {
    const result = await useCase.execute('save');

    expect(mockController.sendRaw).toHaveBeenCalledWith('save\n');
    expect(mockController.waitForDisconnect).toHaveBeenCalled();
    expect(result).toBe('[REBOOT_INITIATED]');
  });

  it('should handle "reboot" command', async () => {
    const result = await useCase.execute('reboot');
    expect(mockController.waitForDisconnect).toHaveBeenCalled();
    expect(result).toBe('[REBOOT_INITIATED]');
  });

  it('should handle "bl" command', async () => {
    const result = await useCase.execute('bl');
    expect(mockController.waitForDisconnect).toHaveBeenCalled();
    expect(result).toBe('[DFU_ENTERED]');
  });

  it('should throw error if device fails to disconnect', async () => {
    mockController.waitForDisconnect.mockRejectedValue(new Error('Timeout waiting for disconnect'));

    try {
      await useCase.execute('save');
      throw new Error('Should have thrown');
    } catch (e) {
      expect(e.message).toContain('Device did not gracefully disconnect');
    }
  });

  it('should handle regular commands without reboot path', async () => {
    mockController.buffer = '# ';
    mockController.waitFor.mockResolvedValue('tasks result # ');
    await useCase.execute('tasks');

    expect(mockController.waitForReboot).not.toHaveBeenCalled();
    expect(mockController.waitFor).toHaveBeenCalledWith('# ', 1500);
  });

  it('should filter out command echo if present', async () => {
    mockController.buffer = 'tasks\nLine 1\n# ';
    mockController.waitFor.mockResolvedValue();
    const result = await useCase.execute('tasks');

    expect(result).toBe('Line 1');
  });

  it('should trigger global timeout if inner execution is slow', async () => {
    jest.useFakeTimers();
    const slowPromise = useCase.execute('slow_cmd');

    // Fast-forward 16 seconds
    jest.advanceTimersByTime(16000);

    await expect(slowPromise).rejects.toThrow('Timeout waiting for CLI response: slow_cmd');
    jest.useRealTimers();
  });
});
