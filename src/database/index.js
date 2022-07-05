const mysql = require('promise-mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pdv_market'
});

const getConnection = () => {
    return connection;
}

module.exports = {
    getConnection
}