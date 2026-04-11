import { jest } from '@jest/globals';

const { default: GetHealthCheckUseCase } = await import('../../src/application/GetHealthCheckUseCase.js');

describe('GetHealthCheckUseCase — Coverage', () => {
    let mockController;
    let mainUseCase;

    beforeEach(() => {
        mockController = {
            connect: jest.fn().mockResolvedValue(),
            sendRaw: jest.fn().mockResolvedValue(),
            waitFor: jest.fn().mockResolvedValue(),
            disconnect: jest.fn().mockResolvedValue(),
            clearBuffer: jest.fn(),
            buffer: '# ',
            onData: jest.fn(() => () => { })
        };
        mainUseCase = new GetHealthCheckUseCase(mockController);
    });

    it('should generate health report successfully', async () => {
        mockController.waitFor.mockResolvedValue('Betaflight\n# ');
        mockController.buffer = 'tasks\nLINE1\nLINE2\n# ';

        const report = await mainUseCase.execute();
        expect(report.timestamp).toBeDefined();
        expect(report.version).toBeDefined();
        expect(report.tasks).toHaveLength(2);
        expect(report.tasks[0]).toBe('LINE1');
    });


    it('should handle partial errors gracefully', async () => {
        mockController.sendRaw.mockRejectedValueOnce(new Error('Port busy'));

        const report = await mainUseCase.execute();
        expect(report.errors[0]).toContain('Error executing \'version\': Port busy');
    });
});

