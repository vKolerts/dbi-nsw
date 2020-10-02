const {app, BrowserWindow} = require('electron');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

let mainWindow;

function createWindow () {
  const dev = !!process.argv[2];
  mainWindow = new BrowserWindow({
    // width: 760,
    // height: 400,
    backgroundColor: '#3a3c43',
    center: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: dev,
      webgl: false,
      // webaudio: false,
      plugins: false,
      defaultFontFamily: 'sansSerif',
    }
  });

  if (dev){
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);
  mainWindow.loadFile('html/index.html');

  mainWindow.on('closed', () => (mainWindow = null));
}

app
.on('ready', createWindow)
.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};
