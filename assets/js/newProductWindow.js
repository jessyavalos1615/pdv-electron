const { ipcRenderer } = require('electron');

const form = document.querySelector('form');
const productName = document.querySelector('#name');
const productPrice = document.querySelector('#price');
const productCode = document.querySelector('#code');
const stock = document.querySelector('#stock');
const min_stock = document.querySelector('#min_stock');
const max_stock = document.querySelector('#max_stock');
const manage_stock = document.querySelector('#manage_stock');

const productNameTest = /^[0-9a-zA-Z\s]{3,}$/;

manage_stock.addEventListener('change', (e) => {
    if (e.target.checked) {
        stock.removeAttribute('disabled');
        min_stock.removeAttribute('disabled');
        max_stock.removeAttribute('disabled');

        stock.value = '0';
        min_stock.value = '0';
        max_stock.value = '0';
    } else {
        stock.setAttribute('disabled', 'disabled');
        min_stock.setAttribute('disabled', 'disabled');
        max_stock.setAttribute('disabled', 'disabled');

        stock.value = '';
        min_stock.value = '';
        max_stock.value = '';
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newProduct = {
        name: productName.value,
        price: productPrice.value === '' ? 0 : parseFloat(productPrice.value),
        code: productCode.value.trim() === '' ? null : productCode.value.trim(),
        stock: stock.value === '' ? 0 : parseFloat(stock.value),
        min_stock: min_stock.value === '' ? 0 : parseFloat(min_stock.value),
        max_stock: max_stock.value === '' ? 0 : parseFloat(max_stock.value),
        manage_stock: manage_stock.checked,
    }
    const res = validateForm(newProduct);
    if (res) {
        ipcRenderer.send('product:new', newProduct);
    }
});

const validateForm = product => {
    if (!productNameTest.test(product.name)) {
        inputValidMessage(productName, 'is-invalid');
        return false;
    }

    if (product.code === null) {
        inputValidMessage(productCode, 'is-invalid');
        return false;
    }

    return true;
}

const inputValidMessage = (input, valid) => {
    input.classList.add(valid);
}