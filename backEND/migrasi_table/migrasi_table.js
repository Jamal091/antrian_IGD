const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'list_bed'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

db.query('CREATE TABLE IF NOT EXISTS rl_kelas (ID INT AUTO_INCREMENT PRIMARY KEY, DESKRIPSI VARCHAR(255))', (err, results) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created or already exists');
});

db.query('CREATE TABLE IF NOT EXISTS ruang_kamar (ID INT AUTO_INCREMENT PRIMARY KEY, ruangan VARCHAR(255), kamar VARCHAR(255), kelas INT, status BOOLEAN)', (err, results) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created or already exists');
});

db.query('CREATE TABLE IF NOT EXISTS ruang_kamar_tidur (ID INT AUTO_INCREMENT PRIMARY KEY, ruang_kamar INT, tempat_tiduur VARCHAR(255), status BOOLEAN)', (err, results) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created or already exists');
});

db.query('CREATE TABLE IF NOT EXISTS ruang_kelas (ID INT AUTO_INCREMENT PRIMARY KEY, tanggal DATETIME, ruangan VARCHAR(255), kelas INT, status BOOLEAN)', (err, results) => {
    if (err) {
        console.error('Error creating table:', err);
        return;
    }
    console.log('Table created or already exists');
});


// Tabel rincian_tagihan untuk menyimpan rincian tagihan layanan medis
db.query(`
    CREATE TABLE IF NOT EXISTS rincian_tagihan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATETIME,
        nopen VARCHAR(50),
        nomor_rm VARCHAR(50),
        nomor_kunjungan VARCHAR(50),
        id_tindakan INT,
        nama_tindakan VARCHAR(255),
        tarif_tindakan DECIMAL(15,2),
        id_dpjp INT,
        nip_dpjp VARCHAR(50),
        nama_dpjp VARCHAR(255),
        nama_pasien VARCHAR(255),
        INDEX idx_nopen (nopen),
        INDEX idx_nomor_kunjungan (nomor_kunjungan),
        INDEX idx_id_tindakan (id_tindakan)
    )
`, (err, results) => {
    if (err) {
        console.error('Error creating table rincian_tagihan:', err);
        return;
    }
    console.log('Table rincian_tagihan created or already exists');
});




module.exports = db;