const { GetContextQuery } = await import('../../src/application/GetContextQuery.js');

describe('GetContextQuery', () => {
  let query;

  beforeEach(() => {
    query = new GetContextQuery();
  });

  test('should return available context topics when no topic is provided', () => {
    const result = query.execute();
    expect(result).toHaveProperty('topics');
    expect(Array.isArray(result.topics)).toBe(true);
    expect(result.topics).toContain('commands');
    expect(result.topics).toContain('safety');
  });

  test('should return specific context for a valid topic (commands)', () => {
    const result = query.execute('commands');
    expect(result).toHaveProperty('topic', 'commands');
    expect(result).toHaveProperty('content');
    expect(result.content).toContain('flycli scan');
  });

  test('should return error context for an invalid topic', () => {
    const result = query.execute('unknown_topic_123');
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Topic not found');
  });
});
