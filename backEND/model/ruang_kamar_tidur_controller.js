const db = require('../config/db.config.js');


exports.getAllRuangKamarTidur = (req, res) => {
    const sql = 'SELECT * FROM ruang_kamar_tidur';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
}

exports.getRuangKamarTidurById = (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM ruang_kamar_tidur WHERE ID = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Data not found' });
            return;
        }
        res.json(results[0]);
    });
}

exports.countRuangKamarTidur = (req, res) => {
    const sql = 'SELECT COUNT(*) AS count FROM ruang_kamar_tidur';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error counting data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results[0]);
    });
}

exports.countRuangKamarTidurbyStatus = (req, res) => {
    const status = req.params.status;
    const sql = 'SELECT COUNT(*) AS count FROM ruang_kamar_tidur WHERE status = ?';
    db.query(sql, [status], (err, results) => {
        if (err) {
            console.error('Error counting data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results[0]);
    });
}

exports.dashboardRuangKamarTidur = (req, res) => {
    const sql = 'SELECT COUNT(*) AS total, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS occupied, SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS available FROM ruang_kamar_tidur';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results[0]);
    });
}

exports.dataDashboardRuangKamarTidur = (req, res) => {
    const queryPanjang = `
SELECT
    -- VVIP
    SUM(CASE WHEN referensi.ID LIKE '5' THEN 1 ELSE 0 END) AS jumlah_kamar_vvip,
    SUM(CASE WHEN referensi.ID LIKE '5' AND ruang_kamar_tidur.status = 1 THEN 1 ELSE 0 END) AS kamar_vvip_tersedia,
    SUM(CASE WHEN referensi.ID LIKE '5' AND ruang_kamar_tidur.status = 2 THEN 1 ELSE 0 END) AS kamar_vvip_terpesan,
    SUM(CASE WHEN referensi.ID LIKE '5' AND ruang_kamar_tidur.status = 3 THEN 1 ELSE 0 END) AS kamar_vvip_terisi,

    -- VIP
    SUM(CASE WHEN referensi.ID LIKE '4' THEN 1 ELSE 0 END) AS jumlah_kamar_vip,
    SUM(CASE WHEN referensi.ID LIKE '4' AND ruang_kamar_tidur.status = 1 THEN 1 ELSE 0 END) AS kamar_vip_tersedia,
    SUM(CASE WHEN referensi.ID LIKE '4' AND ruang_kamar_tidur.status = 2 THEN 1 ELSE 0 END) AS kamar_vip_terpesan,
    SUM(CASE WHEN referensi.ID LIKE '4' AND ruang_kamar_tidur.status = 3 THEN 1 ELSE 0 END) AS kamar_vip_terisi,

    -- President Suite
    SUM(CASE WHEN referensi.ID LIKE '10' THEN 1 ELSE 0 END) AS jumlah_kamar_president,
    SUM(CASE WHEN referensi.ID LIKE '10' AND ruang_kamar_tidur.status = 1 THEN 1 ELSE 0 END) AS kamar_president_tersedia,
    SUM(CASE WHEN referensi.ID LIKE '10' AND ruang_kamar_tidur.status = 2 THEN 1 ELSE 0 END) AS kamar_president_terpesan,
    SUM(CASE WHEN referensi.ID LIKE '10' AND ruang_kamar_tidur.status = 3 THEN 1 ELSE 0 END) AS kamar_president_terisi,

    -- Kelas I (BPJS/KRIS)
    SUM(CASE WHEN referensi.ID IN (1, 2, 3) THEN 1 ELSE 0 END) AS jumlah_kamar_kelas,
    SUM(CASE WHEN referensi.ID IN (1, 2, 3) AND ruang_kamar_tidur.status = 1 THEN 1 ELSE 0 END) AS kamar_kelas_tersedia,
    SUM(CASE WHEN referensi.ID IN (1, 2, 3) AND ruang_kamar_tidur.status = 2 THEN 1 ELSE 0 END) AS kamar_kelas_terpesan,
    SUM(CASE WHEN referensi.ID IN (1, 2, 3) AND ruang_kamar_tidur.status = 3 THEN 1 ELSE 0 END) AS kamar_kelas_terisi

FROM ruang_kamar_tidur
JOIN ruang_kamar ON ruang_kamar_tidur.ruang_kamar = ruang_kamar.id
JOIN referensi ON ruang_kamar.kelas = referensi.id
WHERE ruang_kamar_tidur.status NOT IN (0, 4)
AND ruang_kamar.STATUS = 1
AND referensi.STATUS = 1
AND referensi.JENIS = '19'

 `;

    db.query(queryPanjang, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results[0]);
    });
}