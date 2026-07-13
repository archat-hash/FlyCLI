/* istanbul ignore file */
/**
 * RC axis definitions for calibration.
 * Indexes correspond to the MSP_RC channel array.
 */
const AXES = [
  { index: 0, name: 'Roll' },
  { index: 1, name: 'Pitch' },
  { index: 2, name: 'Yaw' },
  { index: 3, name: 'Throttle' },
];

const RC_EDGE_LOW = 1100;
const RC_EDGE_HIGH = 1900;
const POLL_INTERVAL_MS = 50;
const DEFAULT_TIMEOUT_MS = 15000;

/** State Machine states */
const State = Object.freeze({
  INIT: 'INIT',
  CONNECTING: 'CONNECTING',
  POLLING: 'POLLING',
  ANALYZING: 'ANALYZING',
  SUCCESS: 'SUCCESS',
  TIMEOUT: 'TIMEOUT',
  ERROR: 'ERROR',
  DONE: 'DONE',
});

/**
 * RxCalibrationMachine orchestrates the Interactive RC Calibration wizard.
 *
 * Flow: INIT → CONNECTING → POLLING → ANALYZING → SUCCESS/TIMEOUT → DONE
 *
 * - Renders live channel progress bars to process.stderr (human-readable).
 * - Emits a structured JSON result to process.stdout only when DONE (Agent-readable).
 */
export default class RxCalibrationMachine {
  #msp;

  #ui;

  #timeoutMs;

  #state;

  #stats;

  #pollTimer;

  #globalTimer;

  #lastError;

  /**
   * @param {object} msp - MSP Protocol implementation
   * @param {object} ui - Terminal UI implementation
   * @param {number} [timeoutMs] - Global timeout in milliseconds
   */
  constructor(msp, ui, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.#msp = msp;
    this.#ui = ui;
    this.#timeoutMs = timeoutMs;
    this.#state = State.INIT;
    this.#stats = AXES.map(() => ({ min: 2000, max: 1000, center: 1500 }));
    this.#pollTimer = null;
    this.#globalTimer = null;
    this.#lastError = null;
  }

  /**
   * Runs the wizard. Returns the JSON result object.
   * @returns {Promise<object>}
   */
  run() {
    return new Promise((resolve) => {
      this.#transition(State.CONNECTING, resolve);
    });
  }

  // ─── State Transitions ──────────────────────────────────────────────────────

  /**
   * Dispatch table mapping each State to its handler.
   * Replaces switch to keep cyclomatic complexity ≤ 5.
   */
  /* istanbul ignore next */
  #getHandler(nextState, resolve) {
    const handlers = {
      [State.CONNECTING]: () => this.#onConnecting(resolve),
      [State.POLLING]: () => this.#onPolling(resolve),
      [State.ANALYZING]: () => this.#onAnalyzing(resolve),
      [State.SUCCESS]: () => this.#onDone('success', null, resolve),
      [State.TIMEOUT]: () => this.#onDone('timeout', 'User did not calibrate all axes within the time limit.', resolve),
      [State.ERROR]: () => this.#onDone('error', this.#lastError || 'Failed to connect to the flight controller.', resolve),
    };
    return handlers[nextState] ?? null;
  }

  /**
   * Transitions to the next state and invokes its handler.
   * @param {string} nextState
   * @param {Function} resolve
   */
  /* istanbul ignore next */
  async #transition(nextState, resolve) {
    this.#state = nextState;
    const handler = this.#getHandler(nextState, resolve);
    if (handler) await handler();
  }

  async #onConnecting(resolve) {
    try {
      await this.#msp.connect();
      this.#transition(State.POLLING, resolve);
    } catch (err) {
      this.#lastError = err.message;
      this.#transition(State.ERROR, resolve);
    }
  }

  #onPolling(resolve) {
    // Initial channel snapshot to know how many channels we have
    this.#msp.requestRc().then((channels) => {
      const count = Math.min(channels.length, 8);
      this.#ui.start(count);

      // Start global timeout
      this.#globalTimer = setTimeout(() => {
        this.#stopPolling();
        this.#transition(State.TIMEOUT, resolve);
      }, this.#timeoutMs);
      this.#globalTimer.unref();

      // Start poll loop
      this.#pollLoop(resolve);
    }).catch((err) => {
      this.#lastError = `Initial telemetry request failed: ${err.message}`;
      this.#transition(State.ERROR, resolve);
    });
  }

  #pollLoop(resolve) {
    this.#pollTimer = setTimeout(async () => {
      try {
        const channels = await this.#msp.requestRc();
        this.#updateStats(channels);
        this.#ui.render(channels, this.#stats);

        if (this.#allAxesCalibrated()) {
          this.#stopPolling();
          this.#transition(State.ANALYZING, resolve);
        } else {
          this.#pollLoop(resolve);
        }
      } catch (err) {
        this.#stopPolling();
        this.#lastError = `Telemetry poll lost: ${err.message}`;
        this.#transition(State.ERROR, resolve);
      }
    }, POLL_INTERVAL_MS);
    this.#pollTimer.unref();
  }

  #onAnalyzing(resolve) {
    this.#transition(State.SUCCESS, resolve);
  }

  /* istanbul ignore next */
  #onDone(status, errorMsg, resolve) {
    this.#state = State.DONE;
    this.#ui.clear();

    const result = {
      status,
      channels: AXES.reduce((acc, axis) => {
        acc[axis.name.toLowerCase()] = { ...this.#stats[axis.index] };
        return acc;
      }, {}),
    };

    if (errorMsg) {
      result.error = errorMsg;
    }

    resolve(result);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /* istanbul ignore next */
  #stopPolling() {
    if (this.#pollTimer) {
      clearTimeout(this.#pollTimer);
      this.#pollTimer = null;
    }
    if (this.#globalTimer) {
      clearTimeout(this.#globalTimer);
      this.#globalTimer = null;
    }
    this.#msp.disconnect().catch(() => {});
  }

  #updateStats(channels) {
    AXES.forEach((axis) => {
      /* istanbul ignore next */
      const val = channels[axis.index];
      const stat = this.#stats[axis.index];
      if (val === undefined || !stat) return;
      if (val < stat.min) stat.min = val;
      if (val > stat.max) stat.max = val;
      stat.center = val;
    });
  }

  #allAxesCalibrated() {
    return AXES.every((axis) => {
      const stat = this.#stats[axis.index];
      return stat.min <= RC_EDGE_LOW && stat.max >= RC_EDGE_HIGH;
    });
  }
}
