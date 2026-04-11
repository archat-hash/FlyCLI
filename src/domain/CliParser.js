/**
 * Domain-level parser for Betaflight CLI streams.
 */
export default class CliParser {
  /**
   * Parses raw string from CLI into structured chunks.
   * @param {string} input
   * @returns {Array<{type: string, content: string}>}
   */
  static parse(input) {
    const results = [];
    const lines = input.split(/\r?\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. Betaflight CLI prompt is exactly "# "
      if (line === '# ') {
        results.push({ type: 'PROMPT', content: '# ' });
      } else if (line.includes('rate/hz') || line.includes('max/us') || line.includes('avg/us')) {
        results.push({ type: 'HEADER', content: trimmed });
      } else if (line.startsWith('###')) {
        results.push({ type: 'BANNER', content: trimmed });
      } else if (line.startsWith('#') && line.length > 2) {
        results.push({ type: 'DATA', content: line.substring(1).trim() });
      } else if (line.includes('Betaflight') || line.includes('CLI')) {
        results.push({ type: 'BANNER', content: trimmed });
      } else {
        results.push({ type: 'DATA', content: trimmed });
      }
    });

    return results;
  }
}
