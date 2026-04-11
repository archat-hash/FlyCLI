import { jest } from '@jest/globals';
import IFlightController from '../../src/domain/IFlightController.js';

describe('IFlightController — Base Coverage', () => {
    class MockProxy extends IFlightController { }

    it('base methods should throw not implemented', async () => {
        const proxy = new MockProxy();
        await expect(proxy.connect()).rejects.toThrow('Not implemented');
        await expect(proxy.disconnect()).rejects.toThrow('Not implemented');
        await expect(proxy.sendRaw('data')).rejects.toThrow('Not implemented for data: data');
        await expect(proxy.waitForDisconnect(100)).rejects.toThrow('Not implemented for timeout: 100');
        expect(() => proxy.onData('cb')).toThrow('Not implemented for callback: cb');
    });
});

