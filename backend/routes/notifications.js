import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// HELPER: Otomatis buat pengingat H-1 untuk tugas yang mendekati deadline (SRS US-06)
// =========================================================================
async function generateH1Notifications(userId) {
  if (!userId) return;

  try {
    // Ambil tugas pada kelas yang diikuti user yang deadline-nya dalam rentang 48 jam ke depan,
    // dan status pengerjaan personal user tersebut belum 'selesai'
    const [upcomingTasks] = await pool.query(
      `SELECT t.TASK_ID, t.JUDUL_TUGAS, t.MATA_KULIAH, t.DEADLINE
       FROM TASK t
       JOIN ANGGOTA_KELAS ak ON t.KELAS_ID = ak.KELAS_ID AND ak.USER_ID = ?
       LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?
       WHERE t.DEADLINE > NOW()
         AND t.DEADLINE <= DATE_ADD(NOW(), INTERVAL 48 HOUR)
         AND (st.STATUS IS NULL OR LOWER(st.STATUS) != 'selesai')`,
      [userId, userId]
    );

    for (const t of upcomingTasks) {
      // Periksa apakah notifikasi H-1 untuk tugas ini sudah pernah dibuat untuk user
      const [existing] = await pool.query(
        `SELECT NOTIF_ID FROM NOTIFICATION
         WHERE USER_ID = ? AND TASK_ID = ? AND (JENIS = 'H-1' OR JENIS LIKE '%h-1%' OR JENIS LIKE '%pengingat%')
         LIMIT 1`,
        [userId, t.TASK_ID]
      );

      if (existing.length === 0) {
        const notifId = randomUUID();
        const d = new Date(t.DEADLINE);
        const deadlineJam = !isNaN(d.getTime())
          ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`
          : "23:59 WIB";

        await pool.query(
          `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
           VALUES (?, ?, ?, 'H-1', ?, NOW(), 0)`,
          [
            notifId,
            t.TASK_ID,
            userId,
            `Tenggat waktu tugas '${t.JUDUL_TUGAS}' (${t.MATA_KULIAH}) akan berakhir besok pukul ${deadlineJam}. Pastikan progres tugas Anda sudah selesai!`,
          ]
        );
      }
    }
  } catch (err) {
    console.warn("Gagal auto-generate pengingat H-1:", err.message);
  }
}

// =========================================================================
// GET /api/notifications: Ambil daftar notifikasi untuk user
// Lengkap dengan data mata kuliah dan judul tugas terkait dari tabel TASK
// =========================================================================
router.get("/", async (req, res) => {
  const { userId } = req.query;

  try {
    if (userId) {
      // Jalankan otomatisasi pengingat H-1 terlebih dahulu (US-06)
      await generateH1Notifications(userId);

      const [rows] = await pool.query(
        `SELECT n.NOTIF_ID, n.TASK_ID, n.USER_ID, n.JENIS, n.PESAN, n.WAKTU_KIRIM, n.IS_READ,
                t.JUDUL_TUGAS, t.MATA_KULIAH, t.DEADLINE
         FROM NOTIFICATION n
         LEFT JOIN TASK t ON n.TASK_ID = t.TASK_ID
         WHERE n.USER_ID = ?
         ORDER BY n.WAKTU_KIRIM DESC`,
        [userId]
      );
      return res.json(rows);
    }

    // Jika tanpa filter userId, ambil semua notifikasi (misal untuk admin)
    const [rows] = await pool.query(
      `SELECT n.NOTIF_ID, n.TASK_ID, n.USER_ID, n.JENIS, n.PESAN, n.WAKTU_KIRIM, n.IS_READ,
              t.JUDUL_TUGAS, t.MATA_KULIAH, t.DEADLINE
       FROM NOTIFICATION n
       LEFT JOIN TASK t ON n.TASK_ID = t.TASK_ID
       ORDER BY n.WAKTU_KIRIM DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("Gagal mengambil notifikasi:", e);
    res.status(500).json({ pesan: "Gagal mengambil notifikasi", error: e.message });
  }
});

// =========================================================================
// POST /api/notifications: Buat notifikasi baru secara manual
// =========================================================================
router.post("/", async (req, res) => {
  const { user_id, task_id, jenis, pesan } = req.body;

  if (!user_id || !jenis || !pesan) {
    return res.status(400).json({ pesan: "user_id, jenis, dan pesan wajib diisi" });
  }

  const notifId = randomUUID();

  try {
    await pool.query(
      `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
       VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
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

// =========================================================================
// PUT /api/notifications/:id/read: Tandai satu notifikasi telah dibaca
// =========================================================================
router.put("/:id/read", async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE NOTIFICATION SET IS_READ = 1 WHERE NOTIF_ID = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Notifikasi tidak ditemukan" });
    }

    res.json({ pesan: "Notifikasi ditandai telah dibaca", notif_id: req.params.id });
  } catch (e) {
    console.error("Gagal memperbarui notifikasi:", e);
    res.status(500).json({ pesan: "Gagal memperbarui notifikasi", error: e.message });
  }
});

// =========================================================================
// PUT /api/notifications/read-all: Tandai semua notifikasi dibaca untuk user
// =========================================================================
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

// =========================================================================
// DELETE /api/notifications/:id: Hapus notifikasi
// =========================================================================
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM NOTIFICATION WHERE NOTIF_ID = ?`, [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Notifikasi tidak ditemukan" });
    }

    res.status(204).end();
  } catch (e) {
    console.error("Gagal menghapus notifikasi:", e);
    res.status(500).json({ pesan: "Gagal menghapus notifikasi", error: e.message });
  }
});

export default router;
