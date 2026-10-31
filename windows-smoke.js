// Windows CI exercises the actual packaged EXE against a local fixture, never customers.
const { _electron: electron } = require('playwright');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>Uliza Chat smoke</title><h1>Local chat fixture</h1>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let app;
  try {
    const exe = path.resolve('dist/win-unpacked/Uliza Chat.exe');
    assert.ok(fs.existsSync(exe), 'Packaged EXE exists');
    app = await electron.launch({ executablePath: exe,
      env: { ...process.env, ULIZA_CHAT_URL: origin + '/admin/whatsapp-chat' }, timeout: 60000 });
    const page = await app.firstWindow();
    await page.waitForURL(origin + '/admin/whatsapp-chat');
    assert.ok((await page.evaluate(() => navigator.userAgent)).includes(`UlizaChatDesktop/${require('./package.json').version}`));
    const prefs = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
    assert.equal(prefs.contextIsolation, true);
    assert.equal(prefs.sandbox, true);
    assert.equal(prefs.nodeIntegration, false);
    await page.evaluate(() => { location.href = '/login?redirect=/admin/whatsapp-chat'; });
    await page.waitForURL(url => url.pathname === '/login');
    await page.evaluate(() => { location.href = '/admin/whatsapp-chat?view=crm'; });
    await page.waitForURL(origin + '/admin/whatsapp-chat?view=crm');
    // Main-admin navigation must not replace the workspace window.
    await page.evaluate(() => { location.href = '/admin/dashboard'; });
    await page.waitForTimeout(700);
    assert.ok(page.url().includes('/admin/whatsapp-chat'));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
    const hidden = await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0];
      return !!w && !w.isVisible();
    });
    assert.equal(hidden, true, 'Close keeps the window in the tray');
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].show());
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()), true);
    console.log('Packaged Windows app smoke passed: navigation, sandbox, user agent, tray hide/restore.');
  } finally {
    if (app) await app.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
