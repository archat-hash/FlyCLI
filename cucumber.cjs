/**
 * Cucumber-JS Configuration for FlyCLI (Senior Grade)
 * Centralizes ESM imports and test profiles for General and Hardware-Specific BDD.
 */

module.exports = {
  // Default profile for General behavioral tests
  default: {
    import: [
      'test/bdd/shared_steps/*.js',
    ],
    paths: [
      'test/bdd/general/*.feature',
    ],
    parallel: 1,
    format: [
      'progress-bar',
      'summary',
      ['json', 'test/reports/cucumber_report.json'],
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    language: 'en',
  },

  // Hardware profile for direct firmware verification (OKR Compliance)
  hw: {
    import: [
      'test/bdd/shared_steps/*.js',
      'test/bdd/firmware/v4.3.x/*.js',
    ],
    paths: [
      'test/bdd/firmware/v4.3.x/*.feature',
    ],
    parallel: 1,
    format: [
      'progress-bar',
      'summary',
    ],
  },
};
