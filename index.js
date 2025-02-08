const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

function createWindow() {
  // Log the Electron module and check desktopCapturer in the main process
  //
  const electronModule = require('electron');
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,      // if you need Node integration in your web code
      contextIsolation: false,
      enableRemoteModule: true         // Enable remote module so we can require from the main process
    }
  });
  // Load your HTML file (ensure it's in your project directory)
  win.webContents.openDevTools()
  win.loadFile('index.html');
}

ipcMain.handle('get-screen-sources', async (event, options) => {
  try {
    // options could be something like: { types: ['screen'] }
    const sources = await desktopCapturer.getSources(options);
    return sources;
  } catch (error) {
    return [];
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
