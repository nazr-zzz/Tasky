import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// GET /api/kelas: Ambil daftar kelas (bisa filter ?userId=...)
router.get("/", async (req, res) => {
  const { userId } = req.query;

  try {
    if (userId) {
      // Ambil kelas yang diikut oleh user ini beserta perannya
      const [rows] = await pool.query(
        `SELECT k.KELAS_ID, k.NAMA_KELAS, k.KODE_KELAS, k.DIBUAT_OLEH, k.CREATED_AT,
                ak.PERAN,
                (SELECT COUNT(*) FROM ANGGOTA_KELAS ak2 WHERE ak2.KELAS_ID = k.KELAS_ID) AS JUMLAH_ANGGOTA,
                (SELECT COUNT(*) FROM TASK t WHERE t.KELAS_ID = k.KELAS_ID) AS JUMLAH_TUGAS
         FROM KELAS k
         JOIN ANGGOTA_KELAS ak ON k.KELAS_ID = ak.KELAS_ID
         WHERE ak.USER_ID = ?
         ORDER BY k.CREATED_AT DESC`,
        [userId]
      );
      return res.json(rows);
    }

    // Jika tanpa userId, ambil semua kelas
    const [rows] = await pool.query(
      `SELECT k.*,
              (SELECT COUNT(*) FROM ANGGOTA_KELAS ak WHERE ak.KELAS_ID = k.KELAS_ID) AS JUMLAH_ANGGOTA,
              (SELECT COUNT(*) FROM TASK t WHERE t.KELAS_ID = k.KELAS_ID) AS JUMLAH_TUGAS
       FROM KELAS k
       ORDER BY k.CREATED_AT DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("Gagal mengambil daftar kelas:", e);
    res.status(500).json({ pesan: "Gagal mengambil daftar kelas", error: e.message });
  }
});

// GET /api/kelas/:id: Detail satu kelas
router.get("/:id", async (req, res) => {
  try {
    const [kelasRows] = await pool.query(
      `SELECT k.*,
              (SELECT COUNT(*) FROM ANGGOTA_KELAS ak WHERE ak.KELAS_ID = k.KELAS_ID) AS JUMLAH_ANGGOTA,
              (SELECT COUNT(*) FROM TASK t WHERE t.KELAS_ID = k.KELAS_ID) AS JUMLAH_TUGAS
       FROM KELAS k
       WHERE k.KELAS_ID = ?`,
      [req.params.id]
    );

    if (kelasRows.length === 0) {
      return res.status(404).json({ pesan: "Kelas tidak ditemukan" });
    }

    res.json(kelasRows[0]);
  } catch (e) {
    console.error("Gagal mengambil detail kelas:", e);
    res.status(500).json({ pesan: "Gagal mengambil detail kelas", error: e.message });
  }
});

// GET /api/kelas/:id/anggota: Ambil daftar anggota kelas
router.get("/:id/anggota", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ak.ANGGOTA_ID, ak.KELAS_ID, ak.USER_ID, ak.PERAN, ak.JOINED_AT,
              u.NAMA, u.NIM, u.EMAIL
       FROM ANGGOTA_KELAS ak
       JOIN USER u ON ak.USER_ID = u.USER_ID
       WHERE ak.KELAS_ID = ?
       ORDER BY 
         CASE 
           WHEN ak.PERAN LIKE '%PJMK%' OR ak.PERAN LIKE '%pjmk%' THEN 1 
           WHEN ak.PERAN LIKE '%wakil%' OR ak.PERAN LIKE '%Wakil%' THEN 2 
           ELSE 3 
         END,
         u.NAMA ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error("Gagal mengambil anggota kelas:", e);
    res.status(500).json({ pesan: "Gagal mengambil anggota kelas", error: e.message });
  }
});

// POST /api/kelas: Buat kelas baru (US-01 / F1)
router.post("/", async (req, res) => {
  const { nama_kelas, kode_kelas, dibuat_oleh } = req.body;

  if (!nama_kelas || !dibuat_oleh) {
    return res.status(400).json({ pesan: "nama_kelas dan dibuat_oleh wajib diisi" });
  }

  // Generate kode kelas jika tidak diisi (misal: "BDA-2024" atau 6 karakter random)
  const finalKode = kode_kelas && kode_kelas.trim().length > 0 
    ? kode_kelas.trim().toUpperCase() 
    : Math.random().toString(36).substring(2, 8).toUpperCase();

  const kelasId = randomUUID();
  const anggotaId = randomUUID();

  try {
    // 1. Simpan ke tabel KELAS
    await pool.query(
      `INSERT INTO KELAS (KELAS_ID, DIBUAT_OLEH, NAMA_KELAS, KODE_KELAS)
       VALUES (?, ?, ?, ?)`,
      [kelasId, dibuat_oleh, nama_kelas.trim(), finalKode]
    );

    // 2. Pembuat otomatis terdaftar sebagai PJMK Utama di ANGGOTA_KELAS
    await pool.query(
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN)
       VALUES (?, ?, ?, ?)`,
      [anggotaId, dibuat_oleh, kelasId, "PJMK Utama"]
    );

    res.status(201).json({
      pesan: "Kelas berhasil dibuat",
      kelas: {
        kelas_id: kelasId,
        nama_kelas: nama_kelas.trim(),
        kode_kelas: finalKode,
        dibuat_oleh,
      },
    });
  } catch (e) {
    console.error("Gagal membuat kelas:", e);
    res.status(500).json({ pesan: "Gagal membuat kelas", error: e.message });
  }
});

// POST /api/kelas/join: Gabung ke kelas via kode kelas (US-02 / F1)
router.post("/join", async (req, res) => {
  const { kode_kelas, user_id } = req.body;

  if (!kode_kelas || !user_id) {
    return res.status(400).json({ pesan: "kode_kelas dan user_id wajib diisi" });
  }

  try {
    // Cari kelas berdasarkan kode kelas
    const [kelasRows] = await pool.query(
      `SELECT * FROM KELAS WHERE UPPER(KODE_KELAS) = ? LIMIT 1`,
      [kode_kelas.trim().toUpperCase()]
    );

    if (kelasRows.length === 0) {
      return res.status(404).json({ pesan: "Kode kelas tidak ditemukan. Periksa kembali kodenya." });
    }

    const targetKelas = kelasRows[0];

    // Cek apakah sudah bergabung sebelumnya
    const [existing] = await pool.query(
      `SELECT * FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ?`,
      [targetKelas.KELAS_ID, user_id]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        pesan: "Anda sudah terdaftar di kelas ini.",
        kelas: targetKelas,
      });
    }

    // Tambah ke ANGGOTA_KELAS dengan peran 'Mahasiswa'
    const anggotaId = randomUUID();
    await pool.query(
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN)
       VALUES (?, ?, ?, ?)`,
      [anggotaId, user_id, targetKelas.KELAS_ID, "Mahasiswa"]
    );

    res.status(200).json({
      pesan: `Berhasil bergabung ke kelas ${targetKelas.NAMA_KELAS}`,
      kelas: targetKelas,
    });
  } catch (e) {
    console.error("Gagal gabung kelas:", e);
    res.status(500).json({ pesan: "Gagal bergabung ke kelas", error: e.message });
  }
});

// PUT /api/kelas/:id/anggota/:userId/peran: Update peran anggota kelas (US-09)
router.put("/:id/anggota/:userId/peran", async (req, res) => {
  const { peran } = req.body;
  if (!peran) {
    return res.status(400).json({ pesan: "peran wajib diisi (misal: 'Wakil PJMK' atau 'Mahasiswa')" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE ANGGOTA_KELAS SET PERAN = ? WHERE KELAS_ID = ? AND USER_ID = ?`,
      [peran, req.params.id, req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Anggota kelas tidak ditemukan" });
    }

    res.json({ pesan: "Peran anggota berhasil diperbarui", peran });
  } catch (e) {
    console.error("Gagal mengubah peran anggota:", e);
    res.status(500).json({ pesan: "Gagal mengubah peran", error: e.message });
  }
});

export default router;

