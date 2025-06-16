// ===== FILE SERVER.JS VERSI FINAL STABIL (SEMUA FITUR TERMASUK EDIT & HAPUS) =====

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');
const { URLSearchParams } = require('url');

const app = express();
const PORT = 3000;

// Konfigurasi Kunci Rahasia
const JWT_SECRET = 'kunci_rahasia_jwt_yang_sangat_aman_dan_panjang_123';
const FATSECRET_CLIENT_ID = 'd49da9be31814d958565f16492ae5e98 ';
const FATSECRET_CLIENT_SECRET = 'e497b85576be463e9a1ab3aaab1bc69a';
let fatsecretAccessToken = null;

// Middleware
app.use(cors({
    origin: function (origin, callback) { callback(null, true); },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Konfigurasi Database
const pool = mysql.createPool({
    host: 'localhost', user: 'root', password: '', database: 'kalori_app_db'
}).promise();

// Fungsi untuk meminta Access Token
async function getFatsecretToken() {
    // ... (Fungsi ini sudah benar, tidak perlu diubah)
    const tokenEndpoint = 'https://oauth.fatsecret.com/connect/token';
    const authString = Buffer.from(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'basic');
    try {
        const response = await axios.post(tokenEndpoint, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${authString}` }
        });
        fatsecretAccessToken = response.data.access_token;
        console.log('Access Token FatSecret berhasil didapatkan!');
    } catch (error) {
        console.error('Gagal mendapatkan Access Token FatSecret:', error.response ? error.response.data.error : error.message);
    }
}

// Middleware untuk melindungi rute dengan Token
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// === API ROUTES ===

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ status: 'gagal', pesan: 'Semua kolom harus diisi' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", [username, email, hashedPassword]);
        res.status(201).json({ status: 'sukses', pesan: 'Registrasi berhasil!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ status: 'gagal', pesan: 'Email atau username sudah digunakan.' });
        res.status(500).json({ status: 'gagal', pesan: 'Terjadi kesalahan pada server' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(401).json({ status: 'gagal', pesan: 'Email atau password salah' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ status: 'gagal', pesan: 'Email atau password salah' });
        const payload = { id: user.id, username: user.username, email: user.email, target_kalori: user.target_kalori };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ status: 'sukses', pesan: 'Login berhasil', token: accessToken, user: payload });
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Terjadi kesalahan pada server' });
    }
});

app.get('/me', authenticateUser, (req, res) => {
    res.json({ isLoggedIn: true, user: req.user });
});

app.post('/update-target-kalori', authenticateUser, async (req, res) => {
    const { targetKalori } = req.body;
    try {
        await pool.query("UPDATE users SET target_kalori = ? WHERE id = ?", [targetKalori, req.user.id]);
        res.json({ status: 'sukses', pesan: 'Target kalori diperbarui.' });
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Gagal memperbarui target.' });
    }
});

app.get('/cari-makanan', authenticateUser, async (req, res) => {
    // ... (kode pencarian API sama persis, tidak berubah)
});

app.get('/semua-makanan', authenticateUser, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM makanan WHERE user_id = ? ORDER BY id DESC", [req.user.id]);
        res.json({ status: 'sukses', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Gagal mengambil data makanan.' });
    }
});

app.post('/tambah-makanan', authenticateUser, async (req, res) => {
    const { nama, kalori, waktu } = req.body;
    try {
        const query = "INSERT INTO makanan (user_id, nama, kalori, waktu) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(query, [req.user.id, nama, kalori, waktu]);
        res.status(201).json({ status: 'sukses', data: { id: result.insertId, nama, kalori, waktu } });
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Gagal menambah data makanan.' });
    }
});

// ** RUTE UNTUK EDIT MAKANAN **
app.put('/makanan/:id', authenticateUser, async (req, res) => {
    const { nama, kalori, waktu } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE makanan SET nama = ?, kalori = ?, waktu = ? WHERE id = ? AND user_id = ?",
            [nama, kalori, waktu, req.params.id, req.user.id]
        );
        if (result.affectedRows > 0) {
            res.json({ status: 'sukses' });
        } else {
            res.status(404).json({ status: 'gagal', pesan: 'Data tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Gagal memperbarui data.' });
    }
});

// ** RUTE UNTUK HAPUS MAKANAN **
app.delete('/makanan/:id', authenticateUser, async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM makanan WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (result.affectedRows > 0) {
            res.json({ status: 'sukses' });
        } else {
            res.status(404).json({ status: 'gagal', pesan: 'Data tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ status: 'gagal', pesan: 'Gagal menghapus data.' });
    }
});

// Menjalankan server
app.listen(PORT, async () => {
    await getFatsecretToken();
    console.log(`Server KALORI_APP berhasil berjalan di http://localhost:${PORT}`);
});