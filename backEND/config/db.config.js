const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'master',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
    
});

// const db = mysql.createConnection({
//     host: '137.59.12.227',
//     user: 'admin',
//     password: 'RsMakassar2024@kemkes.go.id',
//     database: 'master',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// const db = mysql.createPool({
//     host: 'srv1864.hstgr.io',
//     user: 'u469821781_muhrinaldy',
//     password: '23Juli2000@',
//     database: 'u469821781_bed',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//         return;
//     }
//     console.log('Connected to the database');
// });

module.exports = db;