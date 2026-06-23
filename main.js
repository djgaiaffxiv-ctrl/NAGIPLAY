'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Ruta al binario de ffmpeg (empaquetado). En build asar hay que des-empaquetarlo.
let ffmpegPath = require('ffmpeg-static');
if (ffmpegPath && ffmpegPath.includes('app.asar') && !ffmpegPath.includes('app.asar.unpacked')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}
let ffJob = null; // proceso ffmpeg en curso

// Extensiones de video/audio que ofrecemos en los diálogos.
const VIDEO_EXTS = ['mp4', 'm4v', 'mkv', 'webm', 'mov', 'ogv', 'avi', 'wmv', 'flv', '3gp', 'mpg', 'mpeg', 'ts'];
const AUDIO_EXTS = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'opus', 'weba'];
const SUB_EXTS = ['srt', 'vtt', 'ass', 'ssa', 'sub'];

let mainWindow = null;
let miniWindow = null;
// Archivos pasados por línea de comandos / asociación (Abrir con...).
let pendingFiles = collectCliFiles(process.argv);

function collectCliFiles(argv) {
  return argv
    .slice(1)
    .filter((a) => !a.startsWith('-') && !a.startsWith('--'))
    .filter((a) => {
      const ext = path.extname(a).slice(1).toLowerCase();
      return [...VIDEO_EXTS, ...AUDIO_EXTS].includes(ext);
    })
    .filter((a) => {
      try { return fs.existsSync(a); } catch { return false; }
    });
}

// Instancia única: si abren un segundo archivo, lo mandamos a la ventana viva.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const files = collectCliFiles(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (files.length) mainWindow.webContents.send('open-files', files);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 720,
    minWidth: 640,
    minHeight: 400,
    backgroundColor: '#0c1416',
    frame: false,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (pendingFiles.length) {
      mainWindow.webContents.send('open-files', pendingFiles);
      pendingFiles = [];
    }
  });

  // Avisar al render de cambios de estado de ventana (para el botón maximizar).
  const sendState = () => mainWindow.webContents.send('window-state', {
    maximized: mainWindow.isMaximized(),
    fullscreen: mainWindow.isFullScreen()
  });
  mainWindow.on('maximize', sendState);
  mainWindow.on('unmaximize', sendState);
  mainWindow.on('enter-full-screen', sendState);
  mainWindow.on('leave-full-screen', sendState);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  // Buscar actualizaciones (solo en la app empaquetada; en desarrollo se ignora).
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => { /* sin conexión o sin releases */ });
  }
});

app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// macOS: abrir con archivo.
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) mainWindow.webContents.send('open-files', [filePath]);
  else pendingFiles.push(filePath);
});

/* ---------------- IPC ---------------- */

ipcMain.handle('open-media-dialog', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir multimedia',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Multimedia', extensions: [...VIDEO_EXTS, ...AUDIO_EXTS] },
      { name: 'Video', extensions: VIDEO_EXTS },
      { name: 'Audio', extensions: AUDIO_EXTS },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  return res.canceled ? [] : res.filePaths;
});

ipcMain.handle('open-folder-dialog', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir carpeta',
    properties: ['openDirectory']
  });
  if (res.canceled || !res.filePaths.length) return [];
  const dir = res.filePaths[0];
  let out = [];
  try {
    out = fs.readdirSync(dir)
      .filter((f) => [...VIDEO_EXTS, ...AUDIO_EXTS].includes(path.extname(f).slice(1).toLowerCase()))
      .map((f) => path.join(dir, f));
  } catch { /* ignorar */ }
  return out;
});

ipcMain.handle('open-subtitle-dialog', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir subtítulos',
    properties: ['openFile'],
    filters: [
      { name: 'Subtítulos', extensions: SUB_EXTS },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  return res.canceled ? null : res.filePaths[0];
});

// Leer subtítulos (.srt / .vtt) y devolver texto + extensión para convertir en el render.
ipcMain.handle('read-subtitle', async (_e, filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return { ext: path.extname(filePath).slice(1).toLowerCase(), text, name: path.basename(filePath) };
  } catch (err) {
    return { error: String(err) };
  }
});

// Guardar captura de fotograma (snapshot).
ipcMain.handle('save-snapshot', async (_e, dataUrl, suggestedName) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar captura',
    defaultPath: suggestedName || 'nagiplay-captura.png',
    filters: [{ name: 'Imagen PNG', extensions: ['png'] }]
  });
  if (res.canceled || !res.filePath) return false;
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(res.filePath, base64, 'base64');
  return res.filePath;
});

// Resolver metadatos básicos de un path (nombre, existe).
ipcMain.handle('stat-files', async (_e, paths) => {
  return paths.map((p) => ({
    path: p,
    name: path.basename(p),
    ext: path.extname(p).slice(1).toLowerCase(),
    exists: (() => { try { return fs.existsSync(p); } catch { return false; } })()
  }));
});

/* ---------- Ajustes persistentes ---------- */
function settingsFile() {
  return path.join(app.getPath('userData'), 'nagiplay-settings.json');
}
ipcMain.handle('load-settings', () => {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch { return {}; }
});
ipcMain.on('save-settings', (_e, data) => {
  try { fs.writeFileSync(settingsFile(), JSON.stringify(data, null, 2)); } catch { /* ignorar */ }
});

/* ---------- Mini-reproductor (acoplado a la barra de tareas) ---------- */
function createMiniWindow() {
  if (miniWindow && !miniWindow.isDestroyed()) return miniWindow;
  miniWindow = new BrowserWindow({
    width: 720, height: 104,
    frame: false, transparent: true, resizable: false, movable: true,
    skipTaskbar: true, alwaysOnTop: true, show: false,
    fullscreenable: false, maximizable: false, minimizable: false, hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  });
  miniWindow.loadFile(path.join(__dirname, 'src', 'mini.html'));
  miniWindow.on('closed', () => { miniWindow = null; });
  return miniWindow;
}
function positionMini() {
  if (!miniWindow) return;
  const d = screen.getPrimaryDisplay();
  const wa = d.workArea; // área de trabajo (excluye la barra de tareas)
  const [w, h] = miniWindow.getSize();
  const x = Math.round(wa.x + (wa.width - w) / 2);
  const y = Math.round(wa.y + wa.height - h); // a ras, pegado a la barra de tareas
  miniWindow.setPosition(x, y);
}
ipcMain.on('enter-mini', () => {
  createMiniWindow();
  positionMini();
  miniWindow.setAlwaysOnTop(true, 'screen-saver'); // flotar por encima de la barra de tareas
  miniWindow.show();
  if (mainWindow) mainWindow.hide();
});
ipcMain.on('exit-mini', () => {
  if (miniWindow && !miniWindow.isDestroyed()) miniWindow.hide();
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('mini-exited'); }
});
ipcMain.on('mini-command', (_e, msg) => {
  if (mainWindow) mainWindow.webContents.send('mini-command', msg);
});
ipcMain.on('player-state', (_e, st) => {
  if (miniWindow && !miniWindow.isDestroyed()) miniWindow.webContents.send('player-state', st);
});

/* ---------- Exportación con ffmpeg ---------- */
ipcMain.handle('pick-save', async (_e, opts) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: (opts && opts.title) || 'Guardar',
    defaultPath: opts && opts.defaultPath,
    filters: (opts && opts.filters) || [{ name: 'Vídeo MP4', extensions: ['mp4'] }]
  });
  return res.canceled ? null : res.filePath;
});

// Ejecuta ffmpeg con los argumentos dados. Emite 'export-progress' (0..1) y resuelve {ok}|{error}.
ipcMain.handle('ffmpeg-export', (e, { args, durationSec }) => {
  return new Promise((resolve) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) { resolve({ error: 'ffmpeg no disponible' }); return; }
    if (ffJob) { resolve({ error: 'Ya hay una exportación en curso' }); return; }
    try {
      ffJob = spawn(ffmpegPath, args, { windowsHide: true });
    } catch (err) { ffJob = null; resolve({ error: String(err) }); return; }

    let errBuf = '';
    ffJob.stderr.on('data', (d) => {
      const s = d.toString();
      errBuf += s; if (errBuf.length > 12000) errBuf = errBuf.slice(-12000);
      const m = s.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m && durationSec > 0) {
        const t = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
        try { e.sender.send('export-progress', Math.max(0, Math.min(1, t / durationSec))); } catch { /* */ }
      }
    });
    ffJob.on('error', (err) => { ffJob = null; resolve({ error: String(err) }); });
    ffJob.on('close', (code, signal) => {
      ffJob = null;
      if (code === 0) resolve({ ok: true });
      else if (signal) resolve({ error: 'cancelado' });
      else resolve({ error: 'ffmpeg código ' + code, detail: errBuf.slice(-1500) });
    });
  });
});
ipcMain.on('ffmpeg-cancel', () => { if (ffJob) { try { ffJob.kill('SIGKILL'); } catch { /* */ } ffJob = null; } });
ipcMain.on('reveal-file', (_e, p) => { try { shell.showItemInFolder(p); } catch { /* */ } });

ipcMain.on('win-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('win-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('win-close', () => mainWindow && mainWindow.close());
ipcMain.on('win-fullscreen', (_e, value) => {
  if (!mainWindow) return;
  const target = typeof value === 'boolean' ? value : !mainWindow.isFullScreen();
  mainWindow.setFullScreen(target);
  // Enviar el estado explícitamente: en ventanas sin marco (Windows) el evento
  // 'enter/leave-full-screen' no siempre dispara de forma fiable.
  mainWindow.webContents.send('window-state', { maximized: mainWindow.isMaximized(), fullscreen: target });
});
ipcMain.on('win-always-on-top', (_e, value) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(!!value);
});
ipcMain.on('open-external', (_e, url) => shell.openExternal(url));
