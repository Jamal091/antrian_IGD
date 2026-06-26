const db = require('./config/db.config.js');

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
        console.error('SQL ERROR:', err);
    } else {
        console.log('RESULTS:', results);
    }
    process.exit();
});
