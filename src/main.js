const { app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');
const url = require('url');
const path = require('path');

const { getConnection } = require('./database/index');

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname)
}

let mainWindow;
let productsWindow;
let newProductWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        movable: false,
        simpleFullscreen: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            // nodeIntegrationInWorker: true,
            // enableRemoteModule: true
        }
    });
    mainWindow.maximize();
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/mainWindow.html'),
        protocol: 'file',
        slashes: true,
    }));
    const mainMenu = Menu.buildFromTemplate(templateMainMenu);
    Menu.setApplicationMenu(mainMenu);
    mainWindow.on('closed', () => app.quit());
});

/* ipcMain Events */
ipcMain.on('product:all', async () => {
    const products = await getProducts();
    productsWindow.webContents.send('product:all', products);
});

ipcMain.on('product:add', e => {
    newProductWindow = new BrowserWindow({
        width: 500,
        height: 600,
        title: 'Products',
        movable: false,
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
        productsWindow.focus();
    });
});

ipcMain.on('product:new', async (e, newProduct) => {
    const product = await createProduct(newProduct);
    productsWindow.webContents.send('product:created', product);
});

/* Template Main Menu */
let templateMainMenu = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Products',
                accelerator: process.platform === 'darwin' ? 'command+P' : 'Ctrl+P',
                click() {
                    productsWindow = new BrowserWindow({
                        title: 'Products',
                        webPreferences: {
                            contextIsolation: false,
                            nodeIntegration: true,
                            devTools: true,
                            // nodeIntegrationInWorker: true,
                            // enableRemoteModule: true
                        },
                    });
                    productsWindow.maximize();
                    // productsWindow.setMenu(null);
                    productsWindow.loadURL(url.format({
                        pathname: path.join(__dirname, './views/productsWindow.html'),
                        protocol: 'file',
                        slashes: true,
                    }));
                    productsWindow.on('close', () => {
                        productsWindow = null;
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

/* MySQL Actions */
const getProducts = async () => {
    const conn = await getConnection();
    const products = await conn.query('SELECT * FROM products');
    return products;
}
const createProduct = async (newProduct) => {
    const conn = await getConnection();
    await conn.query('INSERT INTO products SET ?', newProduct).then(res => {
        new Notification({
            title: 'Products',
            body: 'New product added successfully.',
        }).show();
        newProduct.id = res.insertId;
        productsWindow.focus();
        newProductWindow.close();
    }).catch(err => {
        handleCreateProductError(err)
    });
    return newProduct;
}

const handleCreateProductError = ({ errno }) => {
    let message = '';
    switch (errno) {
        case 1062:
            message = 'The code entered is already in the database. Please enter a new code.'
            break;
        default:
            break;
    }
    new Notification({
        title: 'Error New Product',
        body: message,
    }).show();
};