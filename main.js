// Uliza Chat for Windows: a window around the staff WhatsApp chat at ulizatickets.com.
// Nothing is stored here except window size; sign-in stays in the app's own browser profile.
const { app, BrowserWindow, Menu, Tray, nativeImage, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { isWorkspaceUrl, canUsePermission } = require('./navigation');

const APP_URL = process.env.ULIZA_CHAT_URL || 'https://ulizatickets.com/admin/whatsapp-chat';
const ORIGIN = new URL(APP_URL).origin;
const ICON = path.join(__dirname, 'build', 'icon.png');

let win = null;
let tray = null;
let quitting = false;

if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => show());

app.setAppUserModelId('com.ulizaevents.chat');

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return { width: 1280, height: 820 }; }
}
function saveBounds() {
  if (!win || win.isMinimized()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() })); } catch { /* not critical */ }
}

function show() {
  if (!win) return createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

const sameApp = (url) => isWorkspaceUrl(url, ORIGIN);
// Web links open in the browser; phone numbers open Windows' calling app (Phone Link).
const openOutside = (url) => { if (/^https?:\/\//i.test(url) || /^tel:\+?[1-9]\d{7,14}$/.test(url)) shell.openExternal(url); };

function createWindow() {
  const b = loadBounds();
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width || 1280, height: b.height || 820, minWidth: 380, minHeight: 520,
    title: 'Uliza Chat', icon: ICON, backgroundColor: '#f0f2f5', autoHideMenuBar: true, show: false,
    webPreferences: {
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      // Polling and the call ringtone must keep running while minimised.
      backgroundThrottling: false,
      spellcheck: true,
    },
  });
  if (b.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  // Lets the page hide its own "Install / Download" buttons.
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} UlizaChatDesktop/${app.getVersion()}`);

  // Links to other sites open in the normal browser; the window stays on Uliza.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (sameApp(url)) { win.loadURL(url); return { action: 'deny' }; }
    openOutside(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!sameApp(url)) { e.preventDefault(); openOutside(url); }
  });
  win.webContents.on('will-redirect', (e, url) => {
    if (!sameApp(url)) { e.preventDefault(); win.loadURL(APP_URL); }
  });

  // "(3) WhatsApp chats - Admin" → flash the taskbar button for new unread chats.
  let lastUnread = 0;
  win.on('page-title-updated', (e, title) => {
    e.preventDefault();
    const n = Number((/^\((\d+)\)/.exec(title) || [])[1] || 0);
    win.setTitle(n ? `(${n}) Uliza Chat` : 'Uliza Chat');
    if (tray) tray.setToolTip(n ? `Uliza Chat — ${n} unread` : 'Uliza Chat');
    if (n > lastUnread && !win.isFocused()) win.flashFrame(true);
    lastUnread = n;
  });
  win.on('focus', () => win.flashFrame(false));

  // Closing keeps the app in the tray so calls still ring; Quit from the tray menu.
  win.on('close', (e) => {
    saveBounds();
    if (!quitting && tray) { e.preventDefault(); win.hide(); }
  });
  win.on('closed', () => { win = null; });

  win.webContents.on('did-fail-load', (_e, code, desc, url, isMain) => {
    if (!isMain || code === -3) return; // -3 = navigation replaced
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,sans-serif;background:#f0f2f5;color:#3b4a54;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2 style="font-weight:400">Can't reach Uliza Chat</h2><p>Check your internet connection.</p><p style="color:#8696a0;font-size:13px">${desc}</p><button onclick="location.href='${APP_URL}'" style="margin-top:12px;padding:9px 22px;border:0;border-radius:20px;background:#00a884;color:#fff;font-size:14px;cursor:pointer">Try again</button></div>`)}`);
  });

  win.loadURL(APP_URL);
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip('Uliza Chat');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Uliza Chat', click: show },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', show);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // Microphone (voice calls), notifications and copy are allowed only for Uliza pages.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    cb(canUsePermission(details.requestingUrl || wc.getURL(), wc.getURL(), permission, ORIGIN, details.mediaTypes || []));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin, details) =>
    !!wc && canUsePermission(origin, wc.getURL(), permission, ORIGIN, details?.mediaTypes || []));

  createTray();
  createWindow();

  if (app.isPackaged && !process.env.ULIZA_CHAT_URL) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    } catch { /* updates are optional */ }
  }
});

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
