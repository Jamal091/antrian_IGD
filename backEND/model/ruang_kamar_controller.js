const db = require('../config/db.config.js');


exports.getAllRuangKamar = (req, res) => {
    const sql = 'SELECT * FROM ruang_kamar';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
}