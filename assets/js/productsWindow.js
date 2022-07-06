const { ipcRenderer } = require('electron');
const moment = require('moment');

const btnAddProduct = document.querySelector('#btnAddProduct');
const tableBody = document.querySelector('tbody');

(function () {
    ipcRenderer.send('product:all');
})();

btnAddProduct.addEventListener('click', () => {
    ipcRenderer.send('product:add');
});

ipcRenderer.on('product:all', (e, products) => {
    tableBody.innerHTML = '';
    products.map(product => {
        product.manage_stock = Boolean(product.manage_stock);
        tableBodyTemplate(product);
    });
    tableBodyActions();
});

ipcRenderer.on('product:created', (e, product) => {
    tableBodyTemplate(product);
    tableBodyActions();
});

const tableBodyTemplate = (product) => {
    tableBody.innerHTML += `
        <td>${product.code}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${!product.manage_stock ? 'Disabled' : 'Enabled'}</td>
        <td>${!product.manage_stock ? '-' : product.stock}</td>
        <td>${!product.manage_stock ? '-' : product.min_stock}</td>
        <td>${!product.manage_stock ? '-' : product.max_stock}</td>
        <td>${moment(product.created_at).format('L LT')}</td>
        <td class="d-flex justify-content-between">
            <span class="material-symbols-outlined">visibility</span>
            <span class="material-symbols-outlined editProduct" data-id="${product.id}">edit</span>
            <span class="material-symbols-outlined deleteProduct" data-id="${product.id}">delete</span>
        </td>
    `;

}

const tableBodyActions = () => {
    const btnsDeleteProduct = document.querySelectorAll('.deleteProduct');
    const btnsEditProduct = document.querySelectorAll('.editProduct');

    btnsDeleteProduct.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.dataset.id
            ipcRenderer.send('product:delete', id);
        });
    });

    btnsEditProduct.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.dataset.id;
            ipcRenderer.send('product:edit', id);
        });
    });
}