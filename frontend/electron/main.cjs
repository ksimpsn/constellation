const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = Boolean(process.env.ELECTRON_START_URL);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (isDev) {
    // Load Vite dev server
    win.loadURL(process.env.ELECTRON_START_URL);
    win.webContents.openDevTools();
  } else {
    // Load built app from /dist
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    win.loadFile(indexPath);
    console.log();
  }
}

app.whenReady().then(() => {
  createWindow();

  // REGISTER PROTOCOL *AFTER* APP IS READY
  app.setAsDefaultProtocolClient("constellation");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});