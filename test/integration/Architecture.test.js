import { execSync } from 'child_process';

describe('Architecture & Code Quality Enforcement', () => {
  it('should pass linting (Airbnb style)', () => {
    expect(() => execSync('npx eslint src index.js')).not.toThrow();
  });

  it('should pass dependency-cruiser rules', () => {
    expect(() => execSync('npx dependency-cruiser src')).not.toThrow();
  });
});
