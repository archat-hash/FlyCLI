import { jest } from '@jest/globals';

// Mock MSP and UI
const mockMsp = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  requestRc: jest.fn(),
};

const mockUi = {
  start: jest.fn(),
  render: jest.fn(),
  clear: jest.fn(),
};

jest.unstable_mockModule('../../src/infrastructure/MspProtocol.js', () => ({
  default: jest.fn(() => mockMsp),
}));

jest.unstable_mockModule('../../src/interfaces/ui/terminalIndicator.js', () => ({
  default: jest.fn(() => mockUi),
}));

const { default: RxCalibrationMachine } = await import('../../src/application/wizards/rxCalibrationMachine.js');

describe('RxCalibrationMachine', () => {
  let machine;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // 1s timeout for testing
    machine = new RxCalibrationMachine(mockMsp, mockUi, 1000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should succeed when all axes are calibrated', async () => {
    mockMsp.connect.mockResolvedValue();
    mockMsp.disconnect.mockResolvedValue();

    // Initial requestRc for channel count
    mockMsp.requestRc.mockResolvedValueOnce([1500, 1500, 1500, 1500]);

    const runPromise = machine.run();

    /*
     * Advance to trigger polling
     * CONNECTING -> POLLING
     */
    await jest.advanceTimersByTimeAsync(0);
    // Initial requestRc
    await jest.advanceTimersByTimeAsync(0);

    /*
     * Simulate stick movements
     * 1. Move to edges
     */
    // Lows
    mockMsp.requestRc.mockResolvedValueOnce([1050, 1050, 1050, 1050]);
    await jest.advanceTimersByTimeAsync(50);

    // Highs
    mockMsp.requestRc.mockResolvedValueOnce([1950, 1950, 1950, 1950]);
    await jest.advanceTimersByTimeAsync(50);

    const result = await runPromise;

    expect(result.status).toBe('success');
    expect(result.channels.roll.min).toBeLessThanOrEqual(1100);
    expect(result.channels.roll.max).toBeGreaterThanOrEqual(1900);
    expect(mockUi.render).toHaveBeenCalled();
    expect(mockUi.clear).toHaveBeenCalled();
  });

  test('should timeout if edges are not reached', async () => {
    mockMsp.connect.mockResolvedValue();
    mockMsp.disconnect.mockResolvedValue();
    mockMsp.requestRc.mockResolvedValue([1500, 1500, 1500, 1500]);

    const runPromise = machine.run();

    // CONNECTING -> POLLING
    await jest.advanceTimersByTimeAsync(0);
    // Initial requestRc
    await jest.advanceTimersByTimeAsync(0);

    // Wait for timeout (1000ms set in constructor)
    await jest.advanceTimersByTimeAsync(1100);

    const result = await runPromise;
    expect(result.status).toBe('timeout');
    expect(result.error).toContain('time limit');
  });

  test('should handle connection errors', async () => {
    mockMsp.connect.mockRejectedValue(new Error('Connection failed'));

    const result = await machine.run();
    expect(result.status).toBe('error');
    expect(result.error).toBe('Connection failed');
  });
});
