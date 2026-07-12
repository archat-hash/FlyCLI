/* eslint-disable no-console, multiline-comment-style */
import { execSync } from 'child_process';

console.log('==========================================');
console.log('🚀 Starting Project Analysis 🚀');
console.log('==========================================\n');

function runCommand(name, command) {
  console.log(`\n--- Running ${name} ---`);
  try {
    // stdio: 'inherit' streams output directly to the console
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${name} passed.`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed!`);
    return false;
  }
}

let allPassed = true;

// 1. Linter & Cyclomatic Complexity Check
const lintPassed = runCommand('Linter & Cyclomatic Complexity Check (ESLint)', 'npm run lint');
if (!lintPassed) allPassed = false;

// 2. Hexagonal Architecture Check
const archPassed = runCommand('Hexagonal Architecture Check (Dependency-Cruiser)', 'npm run check:arch');
if (!archPassed) allPassed = false;

// 3. Unit Test Coverage Check (Must be >= 95%)
// Jest will automatically exit with code 1 if thresholds defined in package.json are not met.
const coveragePassed = runCommand('Unit Test Coverage Check (Jest)', 'npm run test:coverage');
if (!coveragePassed) allPassed = false;

console.log('\n==========================================');
if (allPassed) {
  console.log('🎉 All checks passed! The project is in perfect shape.');
  process.exit(0);
} else {
  console.log('💥 Some checks failed. Please review the output above and fix the issues.');
  process.exit(1);
}
