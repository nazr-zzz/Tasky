import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// GET: Ambil semua daftar task (beserta nama kelas jika di-JOIN, dan status pengerjaan jika ada ?userId=...)
router.get("/", async (req, res) => {
  const { userId, kelasId } = req.query;

  try {
    let sql = `
      SELECT t.TASK_ID, t.KELAS_ID, t.DIBUAT_OLEH, t.DIUBAH_OLEH, t.JUDUL_TUGAS, 
             t.MATA_KULIAH, t.DEADLINE, t.DESKRIPSI, t.UPDATED_AT,
             k.NAMA_KELAS, k.KODE_KELAS
    `;

    const params = [];

    if (userId) {
      sql += `, st.STATUS AS STATUS_USER, st.UPDATED_AT AS STATUS_UPDATED_AT
              FROM TASK t
              LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
              LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?`;
      params.push(userId);
    } else {
      sql += ` FROM TASK t
               LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID`;
    }

    if (kelasId) {
      sql += ` WHERE t.KELAS_ID = ?`;
      params.push(kelasId);
    }

    sql += ` ORDER BY t.DEADLINE ASC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: "Gagal mengambil data task" });
  }
});

// GET: Ambil satu task berdasarkan ID (Prepared Statement)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, k.NAMA_KELAS, k.KODE_KELAS 
       FROM TASK t 
       LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID 
       WHERE t.TASK_ID = ?`,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: "Gagal mengambil detail task" });
  }
});

// POST: Tambah task baru
router.post("/", async (req, res) => {
  const {
    task_id,
    kelas_id,
    dibuat_oleh,
    judul_tugas,
    mata_kuliah,
    deadline,
    deskripsi,
  } = req.body;

  const finalTaskId = task_id || randomUUID();

  // Validasi kolom wajib berdasarkan struktur tabel
  if (
    !judul_tugas ||
    !mata_kuliah ||
    !deadline ||
    !kelas_id ||
    !dibuat_oleh
  ) {
    return res
      .status(400)
      .json({
        pesan:
          "kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, dan deadline wajib diisi",
      });
  }

  try {
    await pool.query(
      `INSERT INTO TASK (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        finalTaskId,
        kelas_id,
        dibuat_oleh,
        judul_tugas,
        mata_kuliah,
        deadline,
        deskripsi || null,
      ],
    );

    // Kirim notifikasi tugas baru ke anggota kelas (US-06)
    try {
      const [members] = await pool.query(
        `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
        [kelas_id]
      );
      for (const m of members) {
        if (m.USER_ID !== dibuat_oleh) {
          await pool.query(
            `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN)
             VALUES (?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              finalTaskId,
              m.USER_ID,
              "tugas baru",
              `Tugas baru di ${mata_kuliah}: "${judul_tugas}"`,
            ]
          );
        }
      }
    } catch (notifErr) {
      console.warn("Pemberitahuan tugas baru gagal dikirim:", notifErr.message);
    }

    res.status(201).json({
      task_id: finalTaskId,
      kelas_id,
      judul_tugas,
      mata_kuliah,
      deadline,
      deskripsi: deskripsi || null,
    });
  } catch (e) {
    console.error("ERROR ASLI MYSQL:", e);
    res.status(500).json({ pesan: 'Gagal menyimpan data task', error_detail: e.message });
  } 
});

// PUT: Ubah task berdasarkan ID
router.put("/:id", async (req, res) => {
  const { judul_tugas, mata_kuliah, deadline, deskripsi, diubah_oleh } =
    req.body;

  if (!judul_tugas || !mata_kuliah || !deadline) {
    return res
      .status(400)
      .json({ pesan: "judul_tugas, mata_kuliah, dan deadline wajib diisi" });
  }

  try {
    // Ambil info task lama untuk cek apakah deadline diubah
    const [oldTask] = await pool.query(
      `SELECT DEADLINE, KELAS_ID, JUDUL_TUGAS FROM TASK WHERE TASK_ID = ?`,
      [req.params.id]
    );

    const [hasil] = await pool.query(
      `UPDATE TASK 
       SET JUDUL_TUGAS = ?, MATA_KULIAH = ?, DEADLINE = ?, DESKRIPSI = ?, DIUBAH_OLEH = ? 
       WHERE TASK_ID = ?`,
      [
        judul_tugas,
        mata_kuliah,
        deadline,
        deskripsi || null,
        diubah_oleh || null,
        req.params.id,
      ],
    );

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    // Jika deadline berubah, buat notifikasi untuk seluruh anggota kelas (US-07)
    if (oldTask.length > 0) {
      try {
        const [members] = await pool.query(
          `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
          [oldTask[0].KELAS_ID]
        );
        for (const m of members) {
          await pool.query(
            `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN)
             VALUES (?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              req.params.id,
              m.USER_ID,
              "deadline diubah",
              `Perubahan deadline untuk "${judul_tugas}": ${deadline}`,
            ]
          );
        }
      } catch (notifErr) {
        console.warn("Gagal membuat notifikasi perubahan deadline:", notifErr.message);
      }
    }

    res.json({
      task_id: req.params.id,
      judul_tugas,
      mata_kuliah,
      deadline,
      deskripsi: deskripsi || null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: "Gagal memperbarui data task" });
  }
});

// POST /tasks/:id/status: Perbarui status tugas untuk user (US-05 / F5)
router.post("/:id/status", async (req, res) => {
  const { user_id, status } = req.body;

  if (!user_id || !status) {
    return res.status(400).json({ pesan: "user_id dan status ('belum dikerjakan' | 'selesai') wajib diisi" });
  }

  try {
    const [existing] = await pool.query(
      `SELECT STATUS_ID FROM STATUS_TUGAS WHERE TASK_ID = ? AND USER_ID = ?`,
      [req.params.id, user_id]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE STATUS_TUGAS SET STATUS = ? WHERE TASK_ID = ? AND USER_ID = ?`,
        [status, req.params.id, user_id]
      );
    } else {
      const statusId = randomUUID();
      await pool.query(
        `INSERT INTO STATUS_TUGAS (STATUS_ID, TASK_ID, USER_ID, STATUS)
         VALUES (?, ?, ?, ?)`,
        [statusId, req.params.id, user_id, status]
      );
    }

    res.json({ pesan: "Status tugas berhasil diperbarui", task_id: req.params.id, status });
  } catch (e) {
    console.error("Gagal update status tugas:", e);
    res.status(500).json({ pesan: "Gagal mengubah status tugas", error: e.message });
  }
});

// DELETE: Hapus task berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
    // Hapus relasi status_tugas dan notifikasi terlebih dahulu jika ada
    await pool.query("DELETE FROM STATUS_TUGAS WHERE TASK_ID = ?", [req.params.id]);
    await pool.query("DELETE FROM NOTIFICATION WHERE TASK_ID = ?", [req.params.id]);

    const [hasil] = await pool.query("DELETE FROM TASK WHERE TASK_ID = ?", [
      req.params.id,
    ]);

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: "Gagal menghapus data task" });
  }
});

export default router;
