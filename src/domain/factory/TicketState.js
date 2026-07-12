/**
 * @module TicketState
 * Represents the strict states of the AI Software Factory pipeline.
 */

export const STATES = {
  DRAFT: 'DRAFT',
  READY_FOR_DESIGN: 'READY_FOR_DESIGN',
  READY_FOR_TESTS: 'READY_FOR_TESTS',
  GROOMING: 'GROOMING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
};

/**
 * Validates whether a transition from one state to another is allowed.
 * @param {string} currentState
 * @param {string} nextState
 * @returns {boolean}
 */
export function isValidTransition(currentState, nextState) {
  // BLOCKED can be transitioned back to previous valid states or go to any fallback state.
  if (currentState === STATES.BLOCKED) return true;
  // Anyone can be blocked
  if (nextState === STATES.BLOCKED) return true;

  const validPaths = {
    [STATES.DRAFT]: [STATES.READY_FOR_DESIGN],
    [STATES.READY_FOR_DESIGN]: [STATES.READY_FOR_TESTS],
    [STATES.READY_FOR_TESTS]: [STATES.GROOMING],
    [STATES.GROOMING]: [STATES.IN_PROGRESS, STATES.READY_FOR_DESIGN, STATES.READY_FOR_TESTS],
    [STATES.IN_PROGRESS]: [STATES.READY_FOR_REVIEW],
    // IN_PROGRESS if linter fails
    [STATES.READY_FOR_REVIEW]: [STATES.DONE, STATES.IN_PROGRESS],
    [STATES.DONE]: [],
  };

  return validPaths[currentState]?.includes(nextState) || false;
}

export class TicketState {
  constructor(initialState = STATES.DRAFT) {
    if (!Object.values(STATES).includes(initialState)) {
      throw new Error(`Invalid initial state: ${initialState}`);
    }
    this.state = initialState;
  }

  transition(nextState) {
    if (!isValidTransition(this.state, nextState)) {
      throw new Error(`Invalid transition from ${this.state} to ${nextState}`);
    }
    this.state = nextState;
  }

  get() {
    return this.state;
  }
}
