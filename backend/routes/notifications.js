import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// GET /api/notifications: Ambil daftar notifikasi untuk user
router.get("/", async (req, res) => {
  const { userId } = req.query;

  try {
    let sql = `SELECT * FROM NOTIFICATION`;
    const params = [];

    if (userId) {
      sql += ` WHERE USER_ID = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY WAKTU_KIRIM DESC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("Gagal mengambil notifikasi:", e);
    res.status(500).json({ pesan: "Gagal mengambil notifikasi", error: e.message });
  }
});

// POST /api/notifications: Buat notifikasi baru
router.post("/", async (req, res) => {
  const { user_id, task_id, jenis, pesan } = req.body;

  if (!user_id || !jenis || !pesan) {
    return res.status(400).json({ pesan: "user_id, jenis, dan pesan wajib diisi" });
  }

  const notifId = randomUUID();

  try {
    await pool.query(
      `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN)
       VALUES (?, ?, ?, ?, ?)`,
      [notifId, task_id || null, user_id, jenis, pesan]
    );

    res.status(201).json({
      pesan: "Notifikasi berhasil dibuat",
      notif_id: notifId,
    });
  } catch (e) {
    console.error("Gagal membuat notifikasi:", e);
    res.status(500).json({ pesan: "Gagal membuat notifikasi", error: e.message });
  }
});

// PUT /api/notifications/:id/read: Tandai satu notifikasi telah dibaca
router.put("/:id/read", async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE NOTIFICATION SET IS_READ = 1 WHERE NOTIF_ID = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Notifikasi tidak ditemukan" });
    }

    res.json({ pesan: "Notifikasi ditandai telah dibaca" });
  } catch (e) {
    console.error("Gagal memperbarui notifikasi:", e);
    res.status(500).json({ pesan: "Gagal memperbarui notifikasi", error: e.message });
  }
});

// PUT /api/notifications/read-all: Tandai semua telah dibaca untuk user
router.put("/read-all", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ pesan: "userId wajib diisi" });
  }

  try {
    await pool.query(`UPDATE NOTIFICATION SET IS_READ = 1 WHERE USER_ID = ?`, [
      userId,
    ]);
    res.json({ pesan: "Semua notifikasi ditandai dibaca" });
  } catch (e) {
    console.error("Gagal memperbarui notifikasi:", e);
    res.status(500).json({ pesan: "Gagal memperbarui notifikasi", error: e.message });
  }
});

export default router;

