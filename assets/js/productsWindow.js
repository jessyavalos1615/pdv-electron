const { ipcRenderer } = require('electron');

const btnAddProduct = document.querySelector('#btnAddProduct');
const tableBody = document.querySelector('tbody');

(function () {
    ipcRenderer.send('product:all');
})();

btnAddProduct.addEventListener('click', () => {
    ipcRenderer.send('product:add');
});

ipcRenderer.on('product:all', (e, products) => {
    products.map(product => {
        tableBody.innerHTML += `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td>${product.manage_stock === 0 ? 'Disabled' : 'Enabled'}</td>
            <td>${product.manage_stock === 0 ? '-' : product.stock}</td>
            <td>${product.manage_stock === 0 ? '-' : product.min_stock}</td>
            <td>${product.manage_stock === 0 ? '-' : product.max_stock}</td>
            <td class="d-flex justify-content-between">
                <span class="material-symbols-outlined">visibility</span>
                <span class="material-symbols-outlined">edit</span>
                <span class="material-symbols-outlined">delete</span>
            </td>
        `;
    });
});

ipcRenderer.on('product:created', (e, product) => {
    console.log(product)
    tableBody.innerHTML += `
        <td>${product.code}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${!product.manage_stock ? 'Disabled' : 'Enabled'}</td>
        <td>${!product.manage_stock ? '-' : product.stock}</td>
        <td>${!product.manage_stock ? '-' : product.min_stock}</td>
        <td>${!product.manage_stock ? '-' : product.max_stock}</td>
        <td class="d-flex justify-content-between">
            <span class="material-symbols-outlined">visibility</span>
            <span class="material-symbols-outlined">edit</span>
            <span class="material-symbols-outlined">delete</span>
        </td>
    `;
})