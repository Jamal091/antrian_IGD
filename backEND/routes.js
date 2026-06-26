const express = require('express');
const ruangKamar = require('./model/ruang_kamar_controller.js');
const ruangKamarTidur = require('./model/ruang_kamar_tidur_controller.js');
const ruangKelas = require('./model/ruang_kelas_controller.js');
const rlKelas = require('./model/rl_kelas_controller.js');
const rincianTagihan = require('./model/rincian_tagihan.js');
const antrian = require('./model/antrian_controller.js');
const auth = require('./model/auth_controller.js');
const { verifyToken, verifyRole } = require('./middleware/auth.js');

const router = express.Router();

// Sample route: Home
router.get('/', (req, res) => {
    res.send('Welcome to the jungle');
});
router.get('/rincian_tagihan/user', rincianTagihan.rincian);
router.get('/ruang_kamar', ruangKamar.getAllRuangKamar);
router.get('/ruang_kamar_tidur', ruangKamarTidur.getAllRuangKamarTidur);
router.get('/ruang_kamar_tidur/dashboard', ruangKamarTidur.dataDashboardRuangKamarTidur); // Example of using route parameters
router.get('/ruang_kelas', ruangKelas.getAllRuangKelas);
router.get('/ruang_kelas/:id', ruangKelas.getRuangKelasById); // Example of using route parameters
router.get('/rl_kelas', rlKelas.getAllRlKelas);

// Antrian routes
router.get('/antrian/health', antrian.health);
router.post('/antrian/tickets', antrian.createTicket);
router.get('/antrian/waiting', antrian.getWaiting);
router.get('/antrian/summary', antrian.getSummary);
router.get('/antrian/display', antrian.getDisplay);
router.get('/antrian/call-lock', antrian.getCallLock);
router.get('/antrian/laporan', antrian.getLaporan);

// Protect antrian actions
router.post('/antrian/call-next', verifyToken, antrian.callNext);
router.post('/antrian/call-auto', verifyToken, antrian.callAuto);
router.post('/antrian/call-specific', verifyToken, antrian.callSpecific);
router.post('/antrian/recall', verifyToken, antrian.recall);
router.post('/antrian/tickets/:id/done', verifyToken, antrian.markDone);
router.post('/antrian/tickets/:id/cancel', verifyToken, antrian.cancelTicket);

// Auth & Users routes
router.post('/auth/login', auth.login);
router.get('/users', verifyToken, verifyRole(['Admin']), auth.getUsers);
router.post('/users', verifyToken, verifyRole(['Admin']), auth.createUser);
router.put('/users/:id', verifyToken, verifyRole(['Admin']), auth.updateUser);
router.delete('/users/:id', verifyToken, verifyRole(['Admin']), auth.deleteUser);

router.post('/', (req, res) => {
    const id  = req.body.id || 'defaultId'; // Example of using query parameters
    res.send({message: 'Welcome to the Home Page '+ id });
});

// Sample route: About
router.get('/about', (req, res) => {
    res.send({message: 'INI ABOUT'});
});

router.post('/about', (req, res) => {   
    res.send({message: 'INI POST ABOUT'});
});

// Sample route: Contact
router.get('/contact', (req, res) => {
    res.send('This is the Contact Page');
});

module.exports = router;
