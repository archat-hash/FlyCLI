import { jest } from '@jest/globals';
import SerialFlightController from '../../src/infrastructure/SerialFlightController.js';
import MSP from '../../src/core/msp.js';

describe('SerialFlightController', () => {
    let controller;
    let mockPort;
    let portDataListener;

    beforeEach(() => {
        mockPort = {
            isOpen: false,
            open: jest.fn((callback) => {
                mockPort.isOpen = true;
                setTimeout(() => callback(null), 10);
            }),
            write: jest.fn((data, callback) => {
                if (callback) callback(null);
                return true;
            }),
            on: jest.fn((event, cb) => {
                if (event === 'data') portDataListener = cb;
            }),
            once: jest.fn(),
            removeListener: jest.fn(),
            removeAllListeners: jest.fn(),
            close: jest.fn((callback) => {
                mockPort.isOpen = false;
                if (callback) callback();
            }),
            flush: jest.fn((cb) => cb && cb(null)),
        };

        controller = new SerialFlightController('/dev/tty.test', 115200);
        controller.port = mockPort;
        controller.setupPortListeners();
    });

    test('connect() should perform MSP handshake and wait for CLI banner', async () => {
        const handshakePacket = MSP.encode(MSP.CMD.API_VERSION);
        const connectPromise = controller.connect();

        await new Promise(resolve => setTimeout(resolve, 50));
        if (portDataListener) portDataListener(Buffer.from('\r\nCLI\r\n# '));

        await connectPromise;
        expect(mockPort.open).toHaveBeenCalled();
        expect(mockPort.write).toHaveBeenCalledWith(handshakePacket, expect.anything());
        expect(controller.cliMode).toBe(true);
    });

    test('connect() should reject if port open fails', async () => {
        mockPort.open.mockImplementationOnce((cb) => setTimeout(() => cb(new Error('Open failed')), 0));
        await expect(controller.connect()).rejects.toThrow('Open failed');
    });

    test('disconnect() should close port and reset state', async () => {
        mockPort.isOpen = true;
        await controller.disconnect();
        expect(mockPort.close).toHaveBeenCalled();
        expect(controller.cliMode).toBe(false);
    });

    test('disconnect() should log error if close fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockPort.isOpen = true;
        mockPort.close.mockImplementationOnce((cb) => cb(new Error('Close error')));
        await controller.disconnect();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Close error'));
        consoleSpy.mockRestore();
    });

    test('waitForDisconnect() should resolve when port closes', async () => {
        mockPort.once.mockImplementationOnce((event, resolve) => {
            if (event === 'close') setTimeout(resolve, 10);
        });
        await controller.waitForDisconnect(100);
        expect(mockPort.once).toHaveBeenCalledWith('close', expect.anything());
    });

    test('waitForDisconnect() should timeout if port stays open', async () => {
        mockPort.isOpen = true;
        await expect(controller.waitForDisconnect(50)).rejects.toThrow('Timeout');
    });


    test('clearBuffer should handle flush and its errors', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockPort.isOpen = true;

        controller.clearBuffer();
        expect(mockPort.flush).toHaveBeenCalled();

        mockPort.flush.mockImplementationOnce((cb) => cb(new Error('Flush failed')));
        controller.clearBuffer();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Flush failed'));
        consoleSpy.mockRestore();
    });

    test('attemptCliEntry should retry on timeout', async () => {
        mockPort.isOpen = true;
        controller.waitFor = jest.fn()
            .mockRejectedValueOnce(new Error('Timeout'))
            .mockResolvedValueOnce('CLI mode active');

        await controller.attemptCliEntry(2);
        expect(controller.waitFor).toHaveBeenCalledTimes(2);
    });

    test('onData and removeListener should work correctly', () => {
        const cb = jest.fn();
        const unregister = controller.onData(cb);
        controller.events.emit('data', 'test');
        expect(cb).toHaveBeenCalledWith('test');
        unregister();
        controller.events.emit('data', 'ignored');
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
