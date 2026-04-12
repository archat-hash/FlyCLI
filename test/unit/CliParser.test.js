import CliParser from '../../src/domain/CliParser.js';

describe('CliParser — Unit Tests', () => {
  it('should identify banners, data, and prompt', () => {
    const raw = 'version\n### Betaflight / 4.4.0\n# status\n# ';
    const results = CliParser.parse(raw);

    expect(results).toEqual([
      { type: 'DATA', content: 'version' },
      { type: 'BANNER', content: '### Betaflight / 4.4.0' },
      { type: 'DATA', content: 'status' },
      { type: 'PROMPT', content: '# ' },
    ]);
  });

  it('should identify table headers and data for tasks', () => {
    const raw = 'tasks\nTask list             rate/hz  max/us  avg/us maxload avgload  total/ms   late    run reqd/us\n00 - (         SYSTEM)     10       1       0    0.0%    0.0%         7      0    115\n# ';
    const results = CliParser.parse(raw);

    expect(results).toEqual([
      { type: 'DATA', content: 'tasks' },
      { type: 'HEADER', content: 'Task list             rate/hz  max/us  avg/us maxload avgload  total/ms   late    run reqd/us' },
      { type: 'DATA', content: '00 - (         SYSTEM)     10       1       0    0.0%    0.0%         7      0    115' },
      { type: 'PROMPT', content: '# ' },
    ]);
  });
});
