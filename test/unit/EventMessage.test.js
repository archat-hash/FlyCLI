import EventMessage from '../../src/domain/factory/EventMessage.js';

describe('EventMessage', () => {
  it('should initialize correctly with valid params', () => {
    const msg = new EventMessage({ senderRole: 'Developer', content: 'Hello' });
    expect(msg.senderRole).toBe('Developer');
    expect(msg.content).toBe('Hello');
    expect(msg.ticketId).toBe('global');
    expect(msg.recipientRole).toBeNull();
  });

  it('should throw if senderRole is missing', () => {
    expect(() => new EventMessage({ content: 'Hello' })).toThrow('senderRole is required');
  });

  it('should throw if both content and artifacts are missing', () => {
    expect(() => new EventMessage({ senderRole: 'Developer' })).toThrow('content or artifacts is required');
  });

  it('should allow empty content if artifacts are present', () => {
    const msg = new EventMessage({ senderRole: 'Developer', artifacts: ['file.txt'] });
    expect(msg.artifacts).toContain('file.txt');
  });

  it('should serialize to JSON', () => {
    const msg = new EventMessage({ senderRole: 'Developer', content: 'Hello' });
    const json = msg.toJSON();
    expect(json.senderRole).toBe('Developer');
    expect(json.content).toBe('Hello');
  });

  it('should format toString properly', () => {
    const msg = new EventMessage({ senderRole: 'Developer', content: 'Hello', recipientRole: '@QA' });
    const str = msg.toString();
    expect(str).toContain('Developer');
    expect(str).toContain('[to @QA]');
    expect(str).toContain('Hello');
  });
});
