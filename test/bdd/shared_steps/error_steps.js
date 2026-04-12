import { Given, Then } from '@cucumber/cucumber';
import assert from 'assert';

const { default: FlyCliError } = await import('../../../src/domain/errors/FlyCliError.js');
const { default: TimeoutError } = await import('../../../src/domain/errors/TimeoutError.js');
const { default: ConnectionError } = await import('../../../src/domain/errors/ConnectionError.js');
const { default: DeviceError } = await import('../../../src/domain/errors/DeviceError.js');

const errorMap = {
  TimeoutError: (msg) => new TimeoutError(msg),
  ConnectionError: (msg) => new ConnectionError(msg),
  DeviceError: (msg) => new DeviceError(msg),
};

let thrownError;

Given('a {word} is thrown with a message', (errorName) => {
  thrownError = errorMap[errorName]('test message');
});

Then('it should be an instance of FlyCliError', () => {
  assert.ok(thrownError instanceof FlyCliError);
});

Then('it should have the correct name', () => {
  assert.strictEqual(thrownError.name, thrownError.constructor.name);
});
