import { jest } from '@jest/globals';

// Mock fs/promises
const mockStat = jest.fn();
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    stat: mockStat,
  },
}));

const { EnvironmentManager } = await import('../../src/infrastructure/cad/EnvironmentManager.js');

describe('EnvironmentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FREECAD_PATH;
  });

  it('should find FreeCAD using FREECAD_PATH override', async () => {
    const customPath = '/custom/path/freecad';
    process.env.FREECAD_PATH = customPath;
    mockStat.mockResolvedValue({ isFile: () => true });

    const env = new EnvironmentManager({ info: jest.fn() });
    const found = await env.ensureEnvironmentReady();

    expect(found).toBe(customPath);
    expect(mockStat).toHaveBeenCalledWith(customPath);
  });

  it('should find FreeCAD in standard Windows paths', async () => {
    // Simulate Windows platform for this test if needed,
    // but the list is always present in the code.

    // Mock the first path as missing and the second as existing
    // C:\Program Files\...
    mockStat
      .mockRejectedValueOnce(new Error('Not found'))
      .mockRejectedValueOnce(new Error('Not found'))
      .mockRejectedValueOnce(new Error('Not found'))
      // AppData path
      .mockResolvedValueOnce({ isFile: () => true });

    const env = new EnvironmentManager({ info: jest.fn() });
    const found = await env.ensureEnvironmentReady();

    expect(found).toBeDefined();
    expect(mockStat).toHaveBeenCalled();
  });

  it('should throw error if FreeCAD is not found', async () => {
    mockStat.mockRejectedValue(new Error('Not found'));

    const env = new EnvironmentManager({ info: jest.fn() });
    await expect(env.ensureEnvironmentReady()).rejects.toThrow(/FreeCAD installation not found/);
  });
});
