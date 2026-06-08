const express = require('express');
const mysql2 = require('mysql2/promise');
const Minio = require('minio');
const multer = require('multer');

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const dbPool = mysql2.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'akademik_db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  waitForConnections: true,
  connectionLimit: 10,
  acquireTimeout: 60000,
});

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
});

const MINIO_PUBLIC_HOST = process.env.MINIO_PUBLIC_HOST || 'localhost';
const MINIO_PUBLIC_PORT = process.env.MINIO_PORT || '9000';
const MINIO_PUBLIC_BASE = `http://${MINIO_PUBLIC_HOST}:${MINIO_PUBLIC_PORT}`;

const BUCKET = process.env.MINIO_BUCKET || 'students';

async function initMinioBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1');
    console.log(`[MinIO] Bucket "${BUCKET}" berhasil dibuat.`);
  } else {
    console.log(`[MinIO] Bucket "${BUCKET}" sudah ada.`);
  }
}

const upload = multer({ storage: multer.memoryStorage() });

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'siam-akademik' });
});
app.get('/mahasiswa', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM mahasiswa ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/mahasiswa/:id', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM mahasiswa WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/mahasiswa', upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
]), async (req, res) => {
  const { nim, nama, email, prodi } = req.body;
  let foto_url = null, ijazah_url = null;

  try {
    if (req.files && req.files['foto']) {
      const file = req.files['foto'][0];
      const objectName = `foto/${Date.now()}_${file.originalname}`;
      await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      foto_url = `${MINIO_PUBLIC_BASE}/${BUCKET}/${objectName}`;
    }

    if (req.files && req.files['ijazah']) {
      const file = req.files['ijazah'][0];
      const objectName = `ijazah/${Date.now()}_${file.originalname}`;
      await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      ijazah_url = `${MINIO_PUBLIC_BASE}/${BUCKET}/${objectName}`;
    }

    const [result] = await dbPool.query(
      'INSERT INTO mahasiswa (nim, nama, email, prodi, foto_url, ijazah_url) VALUES (?, ?, ?, ?, ?, ?)',
      [nim, nama, email, prodi, foto_url, ijazah_url]
    );

    res.status(201).json({ success: true, message: 'Mahasiswa berhasil ditambahkan', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/mahasiswa/:id', async (req, res) => {
  const { nama, email, prodi } = req.body;
  try {
    await dbPool.query(
      'UPDATE mahasiswa SET nama = ?, email = ?, prodi = ? WHERE id = ?',
      [nama, email, prodi, req.params.id]
    );
    res.json({ success: true, message: 'Mahasiswa berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/mahasiswa/:id', async (req, res) => {
  try {
    await dbPool.query('DELETE FROM mahasiswa WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Mahasiswa berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    service: 'SIAM Akademik - Nusantara Tech',
    version: '1.0.0',
    endpoints: [
      'GET  /health',
      'GET  /mahasiswa',
      'GET  /mahasiswa/:id',
      'POST /mahasiswa  (form-data: nim, nama, email, prodi, foto?, ijazah?)',
      'PUT  /mahasiswa/:id',
      'DELETE /mahasiswa/:id',
    ],
  });
});


async function startServer() {
  try {

    await dbPool.getConnection();
    console.log('[MySQL] Koneksi berhasil ke mysql:3306');

    await initMinioBucket();

    app.listen(PORT, () => {
      console.log(`[App] Server berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Error] Gagal start server:', err.message);
    console.log('[App] Retry dalam 5 detik...');
    setTimeout(startServer, 5000);
  }
}

startServer();
