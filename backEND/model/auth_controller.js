const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const antrianDb = require('../config/antrian_db.config.js');

const pool = antrianDb.db.promise();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

let schemaPromise = null;

const ensureSchema = async () => {
    if (!schemaPromise) {
        schemaPromise = (async () => {
            await antrianDb.ensureDatabase();

            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'User',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            // Check if there are any users, if not, create default admin
            const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
            if (rows[0].count === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(`
                    INSERT INTO users (username, password_hash, role) 
                    VALUES ('admin', ?, 'Admin')
                `, [hashedPassword]);
                console.log('Default admin user created: admin / admin123');
            }
        })().catch((error) => {
            schemaPromise = null;
            throw error;
        });
    }

    return schemaPromise;
};

const handleAsync = (handler) => async (req, res) => {
    try {
        await ensureSchema();
        await handler(req, res);
    } catch (error) {
        console.error('Auth API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Terjadi kesalahan pada layanan autentikasi',
        });
    }
};

exports.login = handleAsync(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    });
});

exports.getUsers = handleAsync(async (req, res) => {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM users');
    res.json(rows);
});

exports.createUser = handleAsync(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const validRoles = ['Admin', 'Loket IGD', 'Loket Rawat Inap'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        throw error;
    }
});

exports.updateUser = handleAsync(async (req, res) => {
    const userId = req.params.id;
    const { username, password, role } = req.body;

    if (!username || !role) {
        return res.status(400).json({ error: 'Username and role are required' });
    }

    const validRoles = ['Admin', 'Loket IGD', 'Loket Rawat Inap'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?',
                [username, hashedPassword, role, userId]
            );
        } else {
            await pool.query(
                'UPDATE users SET username = ?, role = ? WHERE id = ?',
                [username, role, userId]
            );
        }
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        throw error;
    }
});

exports.deleteUser = handleAsync(async (req, res) => {
    const userId = req.params.id;

    // Prevent deleting oneself
    if (req.user && req.user.id == userId) {
         return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
});
