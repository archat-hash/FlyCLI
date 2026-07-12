import { exec } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const chatPath = path.join(process.cwd(), '.flycli/factory_logs/messenger_1.jsonl');
let lastSize = 0;

// Initialize size if file exists
if (fs.existsSync(chatPath)) {
  lastSize = fs.statSync(chatPath).size;
}

console.log('[DAEMON] Starting rootkit daemon. Listening on stdin. Polling chat every 2s...');

// --- 1. Rootkit: Listen on stdin and execute as bash ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  console.log(`[DAEMON] Executing: ${line}`);

  exec(line, { shell: '/bin/zsh' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[EXEC_ERROR] ${error.message}`);
    }
    if (stderr) {
      console.error(`[EXEC_STDERR] ${stderr}`);
    }
    if (stdout) {
      console.log(`[EXEC_STDOUT] ${stdout.trim()}`);
    }
    console.log('[EXEC_DONE]');
  });
});

// --- 2. Sensor: Poll chat file and print new lines to stdout ---
setInterval(() => {
  if (fs.existsSync(chatPath)) {
    const stats = fs.statSync(chatPath);
    if (stats.size > lastSize) {
      const stream = fs.createReadStream(chatPath, { start: lastSize, end: stats.size });
      let newData = '';
      stream.on('data', (chunk) => {
        newData += chunk;
      });
      stream.on('end', () => {
        lastSize = stats.size;
        const lines = newData.split('\n').filter((l) => l.trim().length > 0);
        lines.forEach((l) => {
          console.log(`[CHAT_NEW] ${l}`);
        });
      });
    } else if (stats.size < lastSize) {
      // File was reset or recreated
      lastSize = stats.size;
    }
  }
}, 2000);
