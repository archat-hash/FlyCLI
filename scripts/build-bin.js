import pkg from 'pkg';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const dirName = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirName, '..');
const distDir = path.join(rootDir, 'dist');

/**
 * Copies native bindings for a specific platform.
 * @param {string} platform
 */
async function copyBindings(platform) {
  const bindingsSrc = path.join(rootDir, 'node_modules', '@serialport', 'bindings-cpp', 'prebuilds', platform);
  const bindingsDest = path.join(distDir, 'prebuilds', platform);

  if (fs.existsSync(bindingsSrc)) {
    process.stdout.write(`  🔗 Copying native bindings for ${platform}...\n`);
    fs.ensureDirSync(bindingsDest);
    fs.copySync(bindingsSrc, bindingsDest);
  } else {
    process.stdout.write(`  ⚠️ Warning: Bindings for ${platform} not found\n`);
  }
}

/**
 * Builds a single target.
 * @param {object} config
 */
async function buildTarget(config) {
  process.stdout.write(`📦 Building for ${config.target}...\n`);
  const outputPath = path.join(distDir, config.output);

  await pkg.exec([
    path.join(rootDir, 'bundle', 'flycli.cjs'),
    '--target', config.target,
    '--output', outputPath,
    '--public',
  ]);

  await copyBindings(config.platform);
}

/**
 * Main build function.
 */
async function build() {
  process.stdout.write('🚀 Starting FlyCLI binary build...\n');

  if (fs.existsSync(distDir)) {
    fs.removeSync(distDir);
  }
  fs.ensureDirSync(distDir);

  const targets = [
    { target: 'node18-win-x64', output: 'flycli-win.exe', platform: 'win32-x64' },
    { target: 'node18-linux-x64', output: 'flycli-linux', platform: 'linux-x64' },
    { target: 'node18-macos-x64', output: 'flycli-macos', platform: 'darwin-x64+arm64' },
  ];

  await Promise.all(targets.map((t) => buildTarget(t)));

  process.stdout.write('\n✅ Build complete! Binaries are in the "dist" folder.\n');
}

build().catch((err) => {
  process.stderr.write(`❌ Build failed: ${err.message}\n`);
  process.exit(1);
});
