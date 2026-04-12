/**
 * Domain-level parser for Betaflight CLI streams.
 */
export default class CliParser {
  /**
   * @param {string} line
   * @returns {boolean}
   */
  static #isTaskHeader(line) {
    return line.includes('rate/hz') || line.includes('max/us') || line.includes('avg/us');
  }

  /**
   * @param {string} line
   * @returns {boolean}
   */
  static #isBannerLine(line) {
    return line.includes('Betaflight') || line.includes('CLI');
  }

  /**
   * @param {string} line
   * @returns {boolean}
   */
  static #isSectionLine(line) {
    return line.startsWith('#') && !line.startsWith('###') && line.length > 2;
  }

  static #TYPE_RULES = [
    [(line) => line === '# ', 'PROMPT'],
    [CliParser.#isTaskHeader, 'HEADER'],
    [(line) => line.startsWith('###'), 'BANNER'],
    [CliParser.#isSectionLine, 'SECTION'],
    [CliParser.#isBannerLine, 'BANNER'],
  ];

  /**
   * @param {string} line
   * @returns {string}
   */
  static #detectType(line) {
    const rule = CliParser.#TYPE_RULES.find(([predicate]) => predicate(line));
    return rule ? rule[1] : 'DATA';
  }

  /**
   * @param {string} line
   * @param {string} type
   * @returns {string}
   */
  static #extractContent(line, type) {
    if (type === 'SECTION') return line.substring(1).trim();
    if (type === 'PROMPT') return line;
    return line.trim();
  }

  /**
   * @param {string} line
   * @returns {{ type: string, content: string }|null}
   */
  static #parseLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const type = CliParser.#detectType(line);
    const resolvedType = type === 'SECTION' ? 'DATA' : type;
    return { type: resolvedType, content: CliParser.#extractContent(line, type) };
  }

  /**
   * Parses raw string from CLI into structured chunks.
   * @param {string} input
   * @returns {Array<{type: string, content: string}>}
   */
  static parse(input) {
    return input.split(/\r?\n/)
      .map((line) => CliParser.#parseLine(line))
      .filter(Boolean);
  }
}
