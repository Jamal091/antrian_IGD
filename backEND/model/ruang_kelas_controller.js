const db = require('../config/db.config.js');


exports.getAllRuangKelas = (req, res) => {
    const sql = 'SELECT * FROM ruang_kelas'
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
}

exports.getRuangKelasById = (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM ruang_kelas WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
}