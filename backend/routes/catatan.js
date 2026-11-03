import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// GET /api/catatan: Ambil catatan milik user
router.get("/", async (req, res) => {
  const { userId, kelasId } = req.query;

  if (!userId) {
    return res.status(400).json({ pesan: "userId wajib diisi" });
  }

  try {
    let sql = `SELECT * FROM CATATAN WHERE USER_ID = ?`;
    const params = [userId];

    if (kelasId) {
      sql += ` AND KELAS_ID = ?`;
      params.push(kelasId);
    }

    sql += ` ORDER BY UPDATED_AT DESC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("Gagal mengambil catatan:", e);
    res.status(500).json({ pesan: "Gagal mengambil catatan", error: e.message });
  }
});

// POST /api/catatan: Buat catatan baru
router.post("/", async (req, res) => {
  const { user_id, kelas_id, mata_kuliah, isi } = req.body;

  if (!user_id || !mata_kuliah || !isi) {
    return res.status(400).json({ pesan: "user_id, mata_kuliah, dan isi wajib diisi" });
  }

  const catatanId = randomUUID();

  try {
    await pool.query(
      `INSERT INTO CATATAN (CATATAN_ID, KELAS_ID, USER_ID, MATA_KULIAH, ISI)
       VALUES (?, ?, ?, ?, ?)`,
      [catatanId, kelas_id || null, user_id, mata_kuliah.trim(), isi]
    );

    res.status(201).json({
      pesan: "Catatan berhasil disimpan",
      catatan: {
        catatan_id: catatanId,
        kelas_id: kelas_id || null,
        user_id,
        mata_kuliah: mata_kuliah.trim(),
        isi,
      },
    });
  } catch (e) {
    console.error("Gagal menyimpan catatan:", e);
    res.status(500).json({ pesan: "Gagal menyimpan catatan", error: e.message });
  }
});

// PUT /api/catatan/:id: Perbarui catatan
router.put("/:id", async (req, res) => {
  const { mata_kuliah, isi } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE CATATAN SET MATA_KULIAH = COALESCE(?, MATA_KULIAH), ISI = COALESCE(?, ISI)
       WHERE CATATAN_ID = ?`,
      [mata_kuliah || null, isi || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Catatan tidak ditemukan" });
    }

    res.json({ pesan: "Catatan berhasil diperbarui" });
  } catch (e) {
    console.error("Gagal memperbarui catatan:", e);
    res.status(500).json({ pesan: "Gagal memperbarui catatan", error: e.message });
  }
});

// DELETE /api/catatan/:id: Hapus catatan
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM CATATAN WHERE CATATAN_ID = ?`, [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Catatan tidak ditemukan" });
    }

    res.status(204).end();
  } catch (e) {
    console.error("Gagal menghapus catatan:", e);
    res.status(500).json({ pesan: "Gagal menghapus catatan", error: e.message });
  }
});

export default router;

