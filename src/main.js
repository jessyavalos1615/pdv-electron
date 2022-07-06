const { app, BrowserWindow, ipcMain, Menu, Notification, dialog } = require('electron');
const url = require('url');
const path = require('path');

const { getConnection } = require('./database/index');

if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname)
}

let mainWindow;
let productsWindow;
let newProductWindow;
let editProductWindow;

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
    editProductWindow?.close();
    editProductWindow = null;
    newProductWindow = new BrowserWindow({
        width: 500,
        height: 600,
        title: 'Add New Product',
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

ipcMain.on('product:edit', async (e, id) => {
    const product = await getProduct(id);
    if (product.length > 0) {
        newProductWindow?.close();
        newProductWindow = null;
        editProductWindow = new BrowserWindow({
            width: 500,
            height: 600,
            title: 'Edit Product',
            movable: false,
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
                // nodeIntegrationInWorker: true,
                // enableRemoteModule: true
            },
        });
        // newProductWindow.setMenu(null);
        editProductWindow.loadURL(url.format({
            pathname: path.join(__dirname, './views/editProductWindow.html'),
            protocol: 'file',
            slashes: true,
        }));
        editProductWindow.webContents.send('product:edit', product[0]);
        editProductWindow.on('close', () => {
            editProductWindow = null;
            productsWindow.focus();
        });
    } else {
        new Notification({
            title: 'Products',
            body: 'Error finding this product. Please reload this window.'
        }).show();
    }
});

ipcMain.on('product:update', async (e, product) => {
    await updateProduct(product);
    const products = await getProducts();
    productsWindow.webContents.send('product:all', products);
});

ipcMain.on('product:delete', async (e, id) => {
    const { response } = await dialog.showMessageBox({
        buttons: ["Yes", "Cancel"],
        message: "Do you really want to delete this product?"
    });
    if (response === 0) {
        await deleteProduct(id);
        const products = await getProducts();
        productsWindow.webContents.send('product:all', products);
        new Notification({
            title: 'Products',
            body: 'Product deleted successfully.',
        }).show();
    }
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
                        newProductWindow?.close();
                        newProductWindow = null;
                        editProductWindow?.close();
                        editProductWindow = null;
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
const getProduct = async (id) => {
    const conn = await getConnection();
    const product = await conn.query('SELECT * FROM products WHERE id = ?', id);
    return product;
}

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
        newProductWindow = null;
    }).catch(err => {
        handleCreateProductError(err)
    });
    return newProduct;
}

const updateProduct = async (product) => {
    console.log(product)
    const conn = await getConnection();
    await conn.query('UPDATE products SET ? WHERE id = ?', [product, product.id]).then(res => { 
        new Notification({
            title: 'Products',
            body: 'Product updated successfully.',
        }).show();
        productsWindow.focus();
        editProductWindow.close();
        editProductWindow = null;
    }).catch(err => {
        handleCreateProductError(err);
     });
}

const deleteProduct = async (id) => {
    const conn = await getConnection();
    await conn.query('DELETE FROM products WHERE id = ?', id);
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