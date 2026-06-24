const db = require('../config/db.config.js');


exports.getAllreferensi = (req, res) => {
    const sql = 'SELECT * FROM rl_kelas';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
}