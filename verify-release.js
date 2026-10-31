const { execFileSync } = require('node:child_process');

// The existing release workflow invokes electron-builder directly. A failed
// hook fails that build, so publishing cannot run without these checks.
module.exports = async () => {
  if (process.platform !== 'win32') throw new Error('Release verification must run on Windows');
  execFileSync(process.execPath, ['--test', 'navigation.test.js'], { stdio: 'inherit', timeout: 30000 });
  execFileSync(process.execPath, ['windows-smoke.js'], { stdio: 'inherit', timeout: 180000 });
  return [];
};
