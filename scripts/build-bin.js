import pkg from 'pkg';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function build() {
  console.log('🚀 Starting FlyCLI binary build...');

  // 1. Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.removeSync(distDir);
  }
  fs.ensureDirSync(distDir);

  // 2. Define targets
  const targets = [
    { target: 'node18-win-x64', output: 'flycli-win.exe', platform: 'win32-x64' },
    { target: 'node18-linux-x64', output: 'flycli-linux', platform: 'linux-x64' },
    { target: 'node18-macos-x64', output: 'flycli-macos', platform: 'darwin-x64+arm64' }
  ];

  for (const t of targets) {
    console.log(`📦 Building for ${t.target}...`);
    
    const outputPath = path.join(distDir, t.output);
    
    try {
      await pkg.exec([
        path.join(rootDir, 'bundle', 'flycli.cjs'),
        '--target', t.target,
        '--output', outputPath,
        '--public'
      ]);


      // 3. Copy native bindings
      const bindingsSrc = path.join(rootDir, 'node_modules', '@serialport', 'bindings-cpp', 'prebuilds', t.platform);
      const bindingsDest = path.join(distDir, 'prebuilds', t.platform);
      
      if (fs.existsSync(bindingsSrc)) {
        console.log(`  🔗 Copying native bindings for ${t.platform}...`);
        fs.ensureDirSync(bindingsDest);
        fs.copySync(bindingsSrc, bindingsDest);
      } else {
        console.warn(`  ⚠️ Warning: Bindings for ${t.platform} not found at ${bindingsSrc}`);
      }
    } catch (err) {
      console.error(`  ❌ Error building ${t.target}:`, err.message);
    }
  }

  console.log('\n✅ Build complete! Binaries are in the "dist" folder.');
  console.log('Note: To run the binary, ensure the "prebuilds" folder is kept next to it.');
}

build();
