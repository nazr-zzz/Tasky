import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// GET /api/kelas: Ambil daftar kelas (bisa filter ?userId=...)
// Aturan Mahasiswa Baru: Jika user belum join kelas, query mengembalikan []
// =========================================================================
router.get("/", async (req, res) => {
  const { userId, user_id } = req.query;
  const targetUserId = userId || user_id;

  try {
    if (targetUserId) {
      // Ambil hanya kelas yang diikuti oleh user ini beserta perannya
      const [rows] = await pool.query(
        `SELECT k.KELAS_ID, k.NAMA_KELAS, k.KODE_KELAS, k.DIBUAT_OLEH, k.CREATED_AT,
                ak.PERAN,
                (SELECT COUNT(*) FROM ANGGOTA_KELAS ak2 WHERE ak2.KELAS_ID = k.KELAS_ID) AS JUMLAH_ANGGOTA,
                (SELECT COUNT(*) FROM TASK t WHERE t.KELAS_ID = k.KELAS_ID) AS JUMLAH_TUGAS
         FROM KELAS k
         JOIN ANGGOTA_KELAS ak ON k.KELAS_ID = ak.KELAS_ID
         WHERE ak.USER_ID = ?
         ORDER BY k.CREATED_AT DESC`,
        [targetUserId]
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

// =========================================================================
// GET /api/kelas/:id: Detail satu kelas
// =========================================================================
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

// =========================================================================
// GET /api/kelas/:id/anggota: Ambil daftar anggota kelas (US-09)
// =========================================================================
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
           WHEN ak.PERAN LIKE '%PJMK Utama%' OR ak.PERAN LIKE '%pjmk utama%' THEN 1
           WHEN ak.PERAN LIKE '%PJMK%' OR ak.PERAN LIKE '%pjmk%' THEN 2
           WHEN ak.PERAN LIKE '%wakil%' OR ak.PERAN LIKE '%Wakil%' OR ak.PERAN LIKE '%pendamping%' THEN 3
           ELSE 4
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

// =========================================================================
// POST /api/kelas: Buat kelas baru (US-01 / F1)
// Pembuat kelas otomatis terdaftar sebagai PJMK Utama
// =========================================================================
router.post("/", async (req, res) => {
  const { nama_kelas, kode_kelas, dibuat_oleh } = req.body;

  if (!nama_kelas || !dibuat_oleh) {
    return res.status(400).json({ pesan: "nama_kelas dan dibuat_oleh wajib diisi" });
  }

  // Generate kode kelas jika tidak diisi (misal: "PWL-8842" atau 6-8 digit random)
  const finalKode =
    kode_kelas && kode_kelas.trim().length > 0
      ? kode_kelas.trim().toUpperCase()
      : Math.random().toString(36).substring(2, 8).toUpperCase();

  const kelasId = randomUUID();
  const anggotaId = randomUUID();

  try {
    // Pastikan user pembuat ada di tabel user untuk menjaga relasi foreign key
    const [userExists] = await pool.query(
      `SELECT USER_ID FROM USER WHERE USER_ID = ?`,
      [dibuat_oleh]
    );

    if (userExists.length === 0) {
      await pool.query(
        `INSERT INTO USER (USER_ID, NAMA, NIM, EMAIL, PASSWORD, CREATED_AT)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [dibuat_oleh, "PJMK Baru", "2108561000", "pjmk@kampus.ac.id", "default123"]
      );
    }

    // 1. Simpan ke tabel KELAS
    await pool.query(
      `INSERT INTO KELAS (KELAS_ID, DIBUAT_OLEH, NAMA_KELAS, KODE_KELAS, CREATED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [kelasId, dibuat_oleh, nama_kelas.trim(), finalKode]
    );

    // 2. Pembuat otomatis terdaftar sebagai PJMK Utama di ANGGOTA_KELAS
    await pool.query(
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN, JOINED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [anggotaId, dibuat_oleh, kelasId, "PJMK Utama"]
    );

    res.status(201).json({
      pesan: "Kelas berhasil dibuat",
      kelas: {
        kelas_id: kelasId,
        nama_kelas: nama_kelas.trim(),
        kode_kelas: finalKode,
        dibuat_oleh,
        peran: "PJMK Utama",
      },
    });
  } catch (e) {
    console.error("Gagal membuat kelas:", e);
    res.status(500).json({ pesan: "Gagal membuat kelas", error: e.message });
  }
});

// =========================================================================
// POST /api/kelas/join: Gabung ke kelas via kode kelas (US-02 / F1)
// =========================================================================
router.post("/join", async (req, res) => {
  const { kode_kelas, user_id, userId } = req.body;
  const finalUserId = user_id || userId;

  if (!kode_kelas || !finalUserId) {
    return res.status(400).json({ pesan: "kode_kelas dan user_id wajib diisi" });
  }

  try {
    // Cari kelas berdasarkan kode kelas
    const [kelasRows] = await pool.query(
      `SELECT * FROM KELAS WHERE UPPER(KODE_KELAS) = ? LIMIT 1`,
      [kode_kelas.trim().toUpperCase()]
    );

    if (kelasRows.length === 0) {
      return res.status(404).json({
        pesan: "Kode kelas tidak ditemukan. Periksa kembali kodenya.",
      });
    }

    const targetKelas = kelasRows[0];

    // Cek apakah user ada di tabel user, jika belum buatkan catatan agar relasi foreign key aman
    const [userExists] = await pool.query(
      `SELECT USER_ID FROM USER WHERE USER_ID = ?`,
      [finalUserId]
    );

    if (userExists.length === 0) {
      await pool.query(
        `INSERT INTO USER (USER_ID, NAMA, NIM, EMAIL, PASSWORD, CREATED_AT)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [finalUserId, "Mahasiswa", "2108569999", "mhs@kampus.ac.id", "default123"]
      );
    }

    // Cek apakah sudah bergabung sebelumnya
    const [existing] = await pool.query(
      `SELECT * FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ?`,
      [targetKelas.KELAS_ID, finalUserId]
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
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN, JOINED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [anggotaId, finalUserId, targetKelas.KELAS_ID, "Mahasiswa"]
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

// =========================================================================
// PUT /api/kelas/:id/anggota/:userId/peran: Update peran anggota kelas (US-09)
// Contoh: Mengangkat mahasiswa menjadi 'PJMK Pendamping' / 'Wakil PJMK'
// =========================================================================
router.put("/:id/anggota/:userId/peran", async (req, res) => {
  const { peran } = req.body;
  if (!peran) {
    return res.status(400).json({
      pesan: "peran wajib diisi (misal: 'PJMK Pendamping', 'Wakil PJMK', atau 'Mahasiswa')",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE ANGGOTA_KELAS SET PERAN = ? WHERE KELAS_ID = ? AND USER_ID = ?`,
      [peran, req.params.id, req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Anggota kelas tidak ditemukan" });
    }

    // Kirim notifikasi pemberitahuan hak akses ke user terkait (US-09)
    try {
      const [kRows] = await pool.query(
        `SELECT NAMA_KELAS FROM KELAS WHERE KELAS_ID = ?`,
        [req.params.id]
      );
      const namaKelas = kRows[0]?.NAMA_KELAS || "Kelas";

      await pool.query(
        `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
         VALUES (?, NULL, ?, 'info', ?, NOW(), 0)`,
        [
          randomUUID(),
          req.params.userId,
          `Selamat! Peran Anda di kelas "${namaKelas}" telah diperbarui menjadi ${peran}. Anda kini memiliki hak untuk menambah dan mengelola tugas perkuliahan.`,
        ]
      );
    } catch (notifErr) {
      console.warn("Gagal membuat notifikasi pengangkatan peran:", notifErr.message);
    }

    res.json({ pesan: "Peran anggota berhasil diperbarui", peran });
  } catch (e) {
    console.error("Gagal mengubah peran anggota:", e);
    res.status(500).json({ pesan: "Gagal mengubah peran", error: e.message });
  }
});

// =========================================================================
// DELETE /api/kelas/:id/anggota/:userId: Keluar kelas / keluarkan anggota
// =========================================================================
router.delete("/:id/anggota/:userId", async (req, res) => {
  const { id, userId } = req.params;

  try {
    // Hapus status pengerjaan tugas pada kelas tersebut
    await pool.query(
      `DELETE FROM STATUS_TUGAS
       WHERE USER_ID = ? AND TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [userId, id]
    );

    const [result] = await pool.query(
      `DELETE FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Anggota kelas tidak ditemukan" });
    }

    res.json({ pesan: "Berhasil keluar dari kelas", kelas_id: id, user_id: userId });
  } catch (e) {
    console.error("Gagal keluar dari kelas:", e);
    res.status(500).json({ pesan: "Gagal keluar dari kelas", error: e.message });
  }
});

// =========================================================================
// DELETE /api/kelas/:id: Hapus kelas beserta seluruh relasi tugasnya (Khusus PJMK)
// =========================================================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Hapus status pengerjaan tugas pada kelas ini
    await pool.query(
      `DELETE FROM STATUS_TUGAS WHERE TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [id]
    );

    // 2. Hapus notifikasi tugas pada kelas ini
    await pool.query(
      `DELETE FROM NOTIFICATION WHERE TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [id]
    );

    // 3. Hapus tugas pada kelas ini
    await pool.query(`DELETE FROM TASK WHERE KELAS_ID = ?`, [id]);

    // 4. Hapus catatan kelas jika ada
    await pool.query(`DELETE FROM CATATAN WHERE KELAS_ID = ?`, [id]);

    // 5. Hapus anggota kelas
    await pool.query(`DELETE FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`, [id]);

    // 6. Hapus kelas
    const [result] = await pool.query(`DELETE FROM KELAS WHERE KELAS_ID = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Kelas tidak ditemukan" });
    }

    res.json({ pesan: "Kelas dan seluruh tugas terkait berhasil dihapus" });
  } catch (e) {
    console.error("Gagal menghapus kelas:", e);
    res.status(500).json({ pesan: "Gagal menghapus kelas", error: e.message });
  }
});

export default router;
