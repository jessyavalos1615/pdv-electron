const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const url = require('url');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            // nodeIntegrationInWorker: true,
            // enableRemoteModule: true
        }
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/mainWindow.html'),
        protocol: 'file',
        slashes: true,
    }));
    const mainMenu = Menu.buildFromTemplate(templateMainMenu);
    Menu.setApplicationMenu(mainMenu);
    mainWindow.on('closed', () => app.quit());
});

let templateMainMenu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Prodcut',
                accelerator: process.platform === 'darwin' ? 'command+N' : 'Ctrl+N',
                click() {
                    newProductWindow = new BrowserWindow({
                        width: 400,
                        height: 350,
                        title: 'New Product',
                        webPreferences: {
                            contextIsolation: false,
                            nodeIntegration: true,
                            // nodeIntegrationInWorker: true,
                            // enableRemoteModule: true
                        },
                    });
                    // newProductWindow.setMenu(null);
                    newProductWindow.loadURL(url.format({
                        pathname: path.join(__dirname, './views/newProductWindow.html'),
                        protocol: 'file',
                        slashes: true,
                    }));
                    newProductWindow.on('close', () => {
                        newProductWindow = null;
                    });
                }
            },
            {
                label: 'Exit',
                accelerator: process.platform === 'darwin' ? 'command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    },
]

if (process.platform === 'darwin') {
    templateMainMenu.unshift({
        label: app.getName(),
    });
}

if (process.env.NODE_ENV !== 'production') {
    templateMainMenu.push({
        label: 'DevTools',
        submenu: [
            {
                label: 'Show/Hide Dev Tools',
                accelerator: process.platform === 'darwin' ? 'command+D' : 'Ctrl+D',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload',
            }
        ]
    });
}
