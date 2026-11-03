import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_tasky',
  waitForConnections: true,
  connectionLimit: 10,
});

// Uji koneksi saat server dinyalakan
try {
  const conn = await pool.getConnection();
  console.log('Terhubung ke basis data MySQL');
  conn.release();
} catch (e) {
  console.error('Gagal terhubung ke basis data:', e.message);
}
