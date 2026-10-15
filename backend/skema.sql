DROP DATABASE IF EXISTS db_tasky;
CREATE DATABASE db_tasky
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_tasky;

CREATE TABLE kategori (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  judul       VARCHAR(100) NOT NULL,
  deskripsi   TEXT,
  status      ENUM('belum', 'selesai') NOT NULL DEFAULT 'belum',
  tanggal     DATE NOT NULL DEFAULT (CURRENT_DATE),
  id_kategori INT,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_kategori) REFERENCES kategori(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Data Awal Kategori
INSERT INTO kategori (nama) VALUES
  ('Pekerjaan'), ('Pribadi'), ('Belajar');

-- Data Awal Task
INSERT INTO tasks (judul, deskripsi, status, id_kategori) VALUES
  ('Belajar Node.js', 'Mempelajari Express dan MySQL', 'belum', 3),
  ('Membuat UI Tasky', 'Implementasi desain React Native', 'belum', 1);