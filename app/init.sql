USE akademik_db;

-- Tabel mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nim         VARCHAR(20)  NOT NULL UNIQUE,
  nama        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  prodi       VARCHAR(100) NOT NULL,
  foto_url    VARCHAR(255) DEFAULT NULL,
  ijazah_url  VARCHAR(255) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data dummy untuk pengujian
INSERT INTO mahasiswa (nim, nama, email, prodi) VALUES
  ('245150700111008', 'Ghani Baskara Syah',   'ghani@student.ub.ac.id',    'Teknologi Informasi'),
  ('245150700111011', 'Septian Nuril Arifin',  'septian@student.ub.ac.id',  'Teknologi Informasi'),
  ('245150701111015', 'Elfareta Zabrina Dewi', 'elfareta@student.ub.ac.id', 'Teknologi Informasi');
