
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// GET /api/catatan
// Mengambil catatan milik user (SRS US-08)
// =========================================================================

router.get("/", async (req, res) => {
  const { userId, user_id, kelasId, kelas_id } = req.query;

  const targetUserId = userId || user_id;
  const targetKelasId = kelasId || kelas_id;

  if (!targetUserId) {
    return res.status(400).json({
      pesan: "userId wajib diisi",
    });
  }

  try {
    let sql = `
      SELECT *
      FROM CATATAN
      WHERE USER_ID = ?
    `;

    const params = [targetUserId];

    if (targetKelasId) {
      sql += ` AND KELAS_ID = ?`;
      params.push(targetKelasId);
    }

    sql += ` ORDER BY UPDATED_AT DESC`;

    const [rows] = await pool.query(sql, params);

    return res.json(rows);

  } catch (e) {
    console.error("Gagal mengambil catatan:", e);

    return res.status(500).json({
      pesan: "Gagal mengambil catatan",
      error: e.message,
    });
  }
});

// =========================================================================
// POST /api/catatan
// Membuat catatan pribadi baru (SRS US-08)
// =========================================================================

router.post("/", async (req, res) => {
  const {
    user_id,
    userId,
    kelas_id,
    kelasId,
    mata_kuliah,
    judul,
    isi,
  } = req.body;

  const finalUserId = user_id || userId;
  const finalKelasId = kelas_id || kelasId || null;

  if (!finalUserId || !isi || !String(isi).trim()) {
    return res.status(400).json({
      pesan: "user_id dan isi wajib diisi",
    });
  }

  const catatanId = randomUUID();

  const matkul =
    mata_kuliah && String(mata_kuliah).trim().length > 0
      ? String(mata_kuliah).trim()
      : "Umum";

  // Mengambil judul atau menggunakan kalimat pertama dari isi catatan
  const finalJudul =
    judul && String(judul).trim().length > 0
      ? String(judul).trim()
      : String(isi).trim().split("\n")[0].slice(0, 50) ||
        "Catatan Kuliah";

  try {
    await pool.query(
      `INSERT INTO CATATAN
       (
         CATATAN_ID,
         KELAS_ID,
         USER_ID,
         MATA_KULIAH,
         JUDUL,
         ISI,
         UPDATED_AT
       )
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        catatanId,
        finalKelasId,
        finalUserId,
        matkul,
        finalJudul,
        String(isi).trim(),
      ]
    );

    return res.status(201).json({
      pesan: "Catatan berhasil disimpan",

      catatan: {
        catatan_id: catatanId,
        kelas_id: finalKelasId,
        user_id: finalUserId,
        mata_kuliah: matkul,
        judul: finalJudul,
        isi: String(isi).trim(),
        updated_at: new Date().toISOString(),
      },
    });

  } catch (e) {
    console.error("Gagal menyimpan catatan:", e);

    return res.status(500).json({
      pesan: "Gagal menyimpan catatan",
      error: e.message,
    });
  }
});

// =========================================================================
// PUT /api/catatan/:id
// Memperbarui catatan pribadi (SRS US-08)
// =========================================================================

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    user_id,
    userId,
    mata_kuliah,
    judul,
    isi,
  } = req.body;

  const finalUserId = user_id || userId;

  // Validasi ID catatan
  if (!id) {
    return res.status(400).json({
      pesan: "ID catatan wajib diisi",
    });
  }

  // Validasi pemilik catatan
  if (!finalUserId) {
    return res.status(400).json({
      pesan: "user_id wajib diisi",
    });
  }

  // Validasi isi data yang akan diperbarui
  const hasMatkul = Object.prototype.hasOwnProperty.call(
    req.body,
    "mata_kuliah"
  );

  const hasJudul = Object.prototype.hasOwnProperty.call(
    req.body,
    "judul"
  );

  const hasIsi = Object.prototype.hasOwnProperty.call(
    req.body,
    "isi"
  );

  if (!hasMatkul && !hasJudul && !hasIsi) {
    return res.status(400).json({
      pesan: "Tidak ada data catatan yang diperbarui",
    });
  }

  // Memastikan data yang dikirim tidak berupa teks kosong
  if (hasJudul && !String(judul ?? "").trim()) {
    return res.status(400).json({
      pesan: "Judul catatan tidak boleh kosong",
    });
  }

  if (hasIsi && !String(isi ?? "").trim()) {
    return res.status(400).json({
      pesan: "Isi catatan tidak boleh kosong",
    });
  }

  try {

    // Memeriksa apakah catatan benar-benar dimiliki user
    const [existingNotes] = await pool.query(
      `SELECT CATATAN_ID
       FROM CATATAN
       WHERE CATATAN_ID = ?
       AND USER_ID = ?`,
      [id, finalUserId]
    );

    if (existingNotes.length === 0) {
      return res.status(404).json({
        pesan: "Catatan tidak ditemukan atau bukan milik Anda",
      });
    }

    // Menyiapkan data yang akan diperbarui
    const finalMatkul = hasMatkul
      ? (String(mata_kuliah ?? "").trim() || "Umum")
      : undefined;

    const finalJudul = hasJudul
      ? String(judul).trim()
      : undefined;

    const finalIsi = hasIsi
      ? String(isi).trim()
      : undefined;

    // UPDATE data catatan di database MySQL
    const [result] = await pool.query(
      `UPDATE CATATAN
       SET
         MATA_KULIAH = COALESCE(?, MATA_KULIAH),
         JUDUL = COALESCE(?, JUDUL),
         ISI = COALESCE(?, ISI),
         UPDATED_AT = NOW()
       WHERE CATATAN_ID = ?
       AND USER_ID = ?`,
      [
        finalMatkul ?? null,
        finalJudul ?? null,
        finalIsi ?? null,
        id,
        finalUserId,
      ]
    );

    // Memastikan catatan ditemukan
    if (result.affectedRows === 0) {
      return res.status(404).json({
        pesan: "Catatan tidak ditemukan atau tidak ada perubahan",
      });
    }

    // Mengambil data terbaru setelah berhasil diperbarui
    const [updatedNotes] = await pool.query(
      `SELECT *
       FROM CATATAN
       WHERE CATATAN_ID = ?
       AND USER_ID = ?`,
      [id, finalUserId]
    );

    return res.status(200).json({
      pesan: "Catatan berhasil diperbarui",
      catatan: updatedNotes[0],
    });

  } catch (e) {
    console.error("Gagal memperbarui catatan:", e);

    return res.status(500).json({
      pesan: "Gagal memperbarui catatan",
      error: e.message,
    });
  }
});

// =========================================================================
// DELETE /api/catatan/:id
// Menghapus catatan pribadi (SRS US-08)
// =========================================================================

router.delete("/:id", async (req, res) => {
  try {

    const [result] = await pool.query(
      `DELETE FROM CATATAN
       WHERE CATATAN_ID = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        pesan: "Catatan tidak ditemukan",
      });
    }

    return res.status(204).end();

  } catch (e) {
    console.error("Gagal menghapus catatan:", e);

    return res.status(500).json({
      pesan: "Gagal menghapus catatan",
      error: e.message,
    });
  }
});

export default router;
