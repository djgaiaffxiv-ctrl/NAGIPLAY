'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Puente seguro renderer <-> main. Identificador interno "nagi" (marca-only).
contextBridge.exposeInMainWorld('nagi', {
  openMedia: () => ipcRenderer.invoke('open-media-dialog'),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  listFolderMedia: (dir) => ipcRenderer.invoke('list-folder-media', dir),
  openFolderPath: (dir) => ipcRenderer.invoke('open-folder-path', dir),
  openSubtitle: () => ipcRenderer.invoke('open-subtitle-dialog'),
  readSubtitle: (p) => ipcRenderer.invoke('read-subtitle', p),
  saveSnapshot: (dataUrl, name) => ipcRenderer.invoke('save-snapshot', dataUrl, name),
  statFiles: (paths) => ipcRenderer.invoke('stat-files', paths),

  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (data) => ipcRenderer.send('save-settings', data),

  pickSave: (opts) => ipcRenderer.invoke('pick-save', opts),
  ffmpegExport: (spec) => ipcRenderer.invoke('ffmpeg-export', spec),
  cancelExport: () => ipcRenderer.send('ffmpeg-cancel'),
  transcodePlayback: (p) => ipcRenderer.invoke('transcode-playback', p),
  cancelTranscode: () => ipcRenderer.send('transcode-cancel'),
  onTranscodeProgress: (cb) => ipcRenderer.on('transcode-progress', (_e, v) => cb(v)),
  revealFile: (p) => ipcRenderer.send('reveal-file', p),
  onExportProgress: (cb) => ipcRenderer.on('export-progress', (_e, v) => cb(v)),

  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  setFullscreen: (v) => ipcRenderer.send('win-fullscreen', v),
  setAlwaysOnTop: (v) => ipcRenderer.send('win-always-on-top', v),
  openExternal: (url) => ipcRenderer.send('open-external', url),

  onOpenFiles: (cb) => ipcRenderer.on('open-files', (_e, files) => cb(files)),
  onWindowState: (cb) => ipcRenderer.on('window-state', (_e, st) => cb(st)),

  // Mini-reproductor (segunda ventana acoplada a la barra de tareas)
  enterMini: () => ipcRenderer.send('enter-mini'),
  exitMini: () => ipcRenderer.send('exit-mini'),
  miniCommand: (msg) => ipcRenderer.send('mini-command', msg),
  onMiniCommand: (cb) => ipcRenderer.on('mini-command', (_e, msg) => cb(msg)),
  playerState: (st) => ipcRenderer.send('player-state', st),
  onPlayerState: (cb) => ipcRenderer.on('player-state', (_e, st) => cb(st)),
  onMiniExited: (cb) => ipcRenderer.on('mini-exited', () => cb())
});
