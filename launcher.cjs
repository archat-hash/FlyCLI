const { spawn } = require('child_process');
const path = require('path');

// Це спрощений запуск FreeCAD для утримання вікна відкритим
const executablePath = '/Applications/FreeCAD.app/Contents/MacOS/FreeCAD';
const listenerPath = path.resolve(__dirname, 'assets/python/freecad_listener.py');
const port = '9099';

console.log('🚀 Запуск незалежної сесії FreeCAD...');

const child = spawn(executablePath, [listenerPath, port], {
  detached: true,
  stdio: 'ignore'
});

child.unref();

console.log('✅ FreeCAD запущено в незалежному режимі. Вікно має залишатися відкритим.');
process.exit(0);
