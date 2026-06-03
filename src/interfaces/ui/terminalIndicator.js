/**
 * TerminalIndicator renders real-time ANSI progress bars for RC channel values
 * to process.stderr (NOT stdout), ensuring stdout stays clean for JSON output.
 *
 * Channel value range: 1000-2000 (standard RC PWM).
 */

const CHANNEL_NAMES = ['Roll', 'Pitch', 'Yaw ', 'Thro', 'CH5 ', 'CH6 ', 'CH7 ', 'CH8 '];
const BAR_WIDTH = 30;
const RC_MIN = 1000;
const RC_MAX = 2000;

const ANSI = {
  clearLine: '\x1b[2K',
  moveCursorUp: (n) => `\x1b[${n}A`,
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * @typedef {object} ChannelStats
 * @property {number} min
 * @property {number} max
 */

/**
 * Renders a single bar segment string (filled + empty).
 * @param {number} value - RC value
 * @returns {string}
 */
function buildBar(value) {
  const clamped = Math.max(RC_MIN, Math.min(RC_MAX, value));
  const fraction = (clamped - RC_MIN) / (RC_MAX - RC_MIN);
  const filled = Math.round(fraction * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return `${ANSI.green}${'█'.repeat(filled)}${ANSI.dim}${'░'.repeat(empty)}${ANSI.reset}`;
}

/**
 * Renders a single progress bar line for a channel.
 * @param {string} name - Channel label
 * @param {number} value - RC value (1000-2000)
 * @param {ChannelStats} stats - Recorded min/max
 * @returns {string}
 */
function renderBar(name, value, stats) {
  const bar = buildBar(value);
  const valueStr = String(value).padStart(4);
  if (!stats) {
    return `${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset} ${bar} ${ANSI.yellow}${valueStr}${ANSI.reset}`;
  }
  const minStr = String(stats.min).padStart(4);
  const maxStr = String(stats.max).padStart(4);
  const rangeStr = `${ANSI.dim}[${minStr}-${maxStr}]${ANSI.reset}`;
  return `${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset} ${bar} ${ANSI.yellow}${valueStr}${ANSI.reset} ${rangeStr}`;
}

const HEADER = `${ANSI.bold}${ANSI.cyan}  FlyCLI RC Wizard — Move all sticks to their edges${ANSI.reset}`;

/**
 * TerminalIndicator class draws and updates a multi-channel RC display in stderr.
 */
export default class TerminalIndicator {
  #lineCount;

  #started;

  constructor() {
    this.#lineCount = 0;
    this.#started = false;
  }

  /**
   * Prints the initial header. Must be called before first render().
   * @param {number} channelCount - Number of channels to display
   */
  start(channelCount) {
    this.#lineCount = channelCount + 2;
    process.stderr.write('\n');
    process.stderr.write(`${HEADER}\n`);
    for (let i = 0; i < channelCount; i += 1) {
      process.stderr.write('\n');
    }
    process.stderr.write('\n');
    this.#started = true;
  }

  /**
   * Redraws all channel bars in-place using ANSI cursor movement.
   * @param {number[]} channels - Array of RC values
   * @param {ChannelStats[]} stats - Per-channel min/max stats
   */
  render(channels, stats) {
    if (!this.#started) return;

    process.stderr.write(ANSI.moveCursorUp(this.#lineCount));
    process.stderr.write(`${ANSI.clearLine}\r`);
    process.stderr.write(`${HEADER}\n`);

    const count = Math.min(channels.length, CHANNEL_NAMES.length);
    for (let i = 0; i < count; i += 1) {
      const name = CHANNEL_NAMES[i] || `CH${i + 1}`;
      const bar = renderBar(name, channels[i], stats[i]);
      process.stderr.write(`${ANSI.clearLine}\r  ${bar}\n`);
    }

    process.stderr.write(`${ANSI.clearLine}\r`);
  }

  /**
   * Clears all drawn lines from stderr after the wizard completes.
   */
  clear() {
    if (!this.#started) return;
    for (let i = 0; i < this.#lineCount; i += 1) {
      process.stderr.write(`${ANSI.moveCursorUp(1)}${ANSI.clearLine}\r`);
    }
    this.#started = false;
  }
}
