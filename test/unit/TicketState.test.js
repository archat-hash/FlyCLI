import { TicketState, STATES, isValidTransition } from '../../src/domain/factory/TicketState.js';

describe('TicketState', () => {
  it('should initialize with DRAFT by default', () => {
    const ticket = new TicketState();
    expect(ticket.get()).toBe(STATES.DRAFT);
  });

  it('should throw error on invalid initial state', () => {
    expect(() => new TicketState('INVALID_STATE')).toThrow();
  });

  it('should allow valid transitions', () => {
    const ticket = new TicketState(STATES.DRAFT);
    ticket.transition(STATES.READY_FOR_DESIGN);
    expect(ticket.get()).toBe(STATES.READY_FOR_DESIGN);

    ticket.transition(STATES.READY_FOR_TESTS);
    expect(ticket.get()).toBe(STATES.READY_FOR_TESTS);
  });

  it('should throw error on invalid transitions', () => {
    const ticket = new TicketState(STATES.DRAFT);
    expect(() => ticket.transition(STATES.IN_PROGRESS)).toThrow();
  });

  it('isValidTransition logic', () => {
    expect(isValidTransition(STATES.DRAFT, STATES.READY_FOR_DESIGN)).toBe(true);
    expect(isValidTransition(STATES.DRAFT, STATES.DONE)).toBe(false);

    // Blocking rules
    expect(isValidTransition(STATES.GROOMING, STATES.BLOCKED)).toBe(true);
    // can go anywhere from BLOCKED
    expect(isValidTransition(STATES.BLOCKED, STATES.READY_FOR_DESIGN)).toBe(true);
  });
});
