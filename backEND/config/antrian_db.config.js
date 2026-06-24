const mysql = require('mysql2');
require('dotenv').config();

const databaseName = process.env.ANTRIAN_DB_NAME || 'antrian_igd';

const envValue = (key, fallback) => {
    return Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : fallback;
};

const baseConfig = {
    host: envValue('ANTRIAN_DB_HOST', process.env.DB_HOST || '127.0.0.1'),
    user: envValue('ANTRIAN_DB_USER', process.env.DB_USER || 'root'),
    password: envValue('ANTRIAN_DB_PASSWORD', process.env.DB_PASSWORD || ''),
    waitForConnections: true,
    connectionLimit: Number(process.env.ANTRIAN_DB_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
};

const quoteIdentifier = (value) => {
    const identifier = String(value || '').trim();

    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
        throw new Error('ANTRIAN_DB_NAME hanya boleh berisi huruf, angka, dan underscore');
    }

    return `\`${identifier}\``;
};

const adminPool = mysql.createPool(baseConfig).promise();
const db = mysql.createPool({
    ...baseConfig,
    database: databaseName,
});

let databasePromise = null;

const ensureDatabase = async () => {
    if (!databasePromise) {
        databasePromise = adminPool.query(`
            CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)}
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `).catch((error) => {
            databasePromise = null;
            throw error;
        });
    }

    return databasePromise;
};

module.exports = {
    db,
    databaseName,
    ensureDatabase,
};
