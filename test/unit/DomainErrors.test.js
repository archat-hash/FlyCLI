const { default: FlyCliError } = await import('../../src/domain/errors/FlyCliError.js');
const { default: TimeoutError } = await import('../../src/domain/errors/TimeoutError.js');
const { default: ConnectionError } = await import('../../src/domain/errors/ConnectionError.js');
const { default: DeviceError } = await import('../../src/domain/errors/DeviceError.js');

describe('Domain Errors', () => {
  /** Given a TimeoutError is thrown */
  describe('TimeoutError', () => {
    it('should be an instance of FlyCliError', () => {
      /** When */
      const err = new TimeoutError('timed out');

      /** Then */
      expect(err).toBeInstanceOf(FlyCliError);
      expect(err).toBeInstanceOf(TimeoutError);
      expect(err.name).toBe('TimeoutError');
      expect(err.message).toBe('timed out');
    });
  });

  /** Given a ConnectionError is thrown */
  describe('ConnectionError', () => {
    it('should be an instance of FlyCliError', () => {
      /** When */
      const err = new ConnectionError('connection lost');

      /** Then */
      expect(err).toBeInstanceOf(FlyCliError);
      expect(err).toBeInstanceOf(ConnectionError);
      expect(err.name).toBe('ConnectionError');
    });
  });

  /** Given a DeviceError is thrown */
  describe('DeviceError', () => {
    it('should be an instance of FlyCliError', () => {
      /** When */
      const err = new DeviceError('device failure');

      /** Then */
      expect(err).toBeInstanceOf(FlyCliError);
      expect(err).toBeInstanceOf(DeviceError);
      expect(err.name).toBe('DeviceError');
    });
  });
});
