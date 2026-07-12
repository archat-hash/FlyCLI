import { jest } from '@jest/globals';
import ConsoleLogger from '../../src/infrastructure/Logger.js';

describe('ConsoleLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new ConsoleLogger();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call console.info on info()', () => {
    logger.info('test info');
    expect(console.info).toHaveBeenCalledWith('test info');
  });

  it('should call console.log on log()', () => {
    logger.log('test log');
    expect(console.log).toHaveBeenCalledWith('test log');
  });

  it('should call console.error on error()', () => {
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('test error');
  });

  it('should call console.debug on debug()', () => {
    logger.debug('test debug');
    expect(console.debug).toHaveBeenCalledWith('test debug');
  });
});
