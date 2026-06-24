const db = require('../config/db.config.js');

exports.rincian = (req, res) => {
    const status = req.params.status;
    const sql = `
    SELECT
      pp.TANGGAL AS tanggal,
      pp.NOMOR AS nopen,
      pp.NORM AS nomor_rm,
      pk.NOMOR AS nomor_kunjungan,
      ltm.TINDAKAN AS id_tindakan,
      mnt.NAMA AS nama_tindakan,
      mtt.TARIF AS tarif_tindakan,
      pk.DPJP AS id_dpjp,
      mdt.NIP AS nip_dpjp,
      mpg.NAMA AS nama_dpjp,
      mp.NAMA AS nama_pasien
    FROM pendaftaran.pendaftaran pp
    JOIN pendaftaran.penjamin pj ON pp.NOMOR = pj.NOPEN
    JOIN master.pasien mp ON mp.NORM = pp.NORM
    JOIN pendaftaran.kunjungan pk ON pk.NOPEN = pp.NOMOR
    JOIN master.dokter mdt ON pk.DPJP = mdt.ID
    JOIN master.pegawai mpg ON mdt.NIP = mpg.NIP
    JOIN layanan.tindakan_medis ltm ON pk.NOMOR = ltm.KUNJUNGAN
    JOIN master.tindakan mnt ON ltm.TINDAKAN = mnt.ID
    JOIN master.tarif_tindakan mtt ON ltm.TINDAKAN = mtt.TINDAKAN
    WHERE pp.TANGGAL BETWEEN $1 AND $2
      AND mnt.STATUS = '1'
      AND pj.JENIS = '1'
    ORDER BY pp.TANGGAL ASC, pk.NOMOR ASC;
  `;
    db.query(sql, [status], (err, results) => {
        if (err) {
            console.error('Error counting data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results[0]);
    });
}