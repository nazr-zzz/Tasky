import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// HELPER
// =========================================================================

// Ubah berbagai format deadline menjadi objek Date. Mengembalikan null jika tidak valid.
function parseDeadline(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();

  // Format SQL: YYYY-MM-DD HH:MM[:SS] (dianggap waktu lokal server)
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    return isNaN(d.getTime()) ? null : d;
  }

  // Format ISO 8601 (dari date picker aplikasi), contoh 2026-12-01T16:59:00.000Z
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format teks Indonesia: "16 Nov 2026, 23:59 WIB"
  const clean = str
    .replace(/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)[,\s]*/i, "")
    .replace(/[•,]/g, " ")
    .replace(/\s+(wib|wita|wit)$/i, "")
    .trim();

  const bulan = {
    jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2,
    apr: 3, april: 3, mei: 4, may: 4, jun: 5, juni: 5,
    jul: 6, juli: 6, agu: 7, agustus: 7, aug: 7, sep: 8, september: 8,
    okt: 9, oktober: 9, oct: 9, nov: 10, november: 10, des: 11, desember: 11, dec: 11,
  };

  m = clean.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const bln = bulan[m[2].toLowerCase()];
    if (bln !== undefined) {
      const d = new Date(+m[3], bln, +m[1], m[4] ? +m[4] : 23, m[5] ? +m[5] : 59, m[6] ? +m[6] : 0);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

// Format tanggal untuk teks notifikasi / tampilan
function formatIndonesianDeadline(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${hours}:${mins} WIB`;
}

// Peran user di sebuah kelas (null jika bukan anggota)
async function getPeran(kelasId, userId) {
  if (!kelasId || !userId) return null;
  const [rows] = await pool.query(
    `SELECT PERAN FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ? LIMIT 1`,
    [kelasId, userId]
  );
  return rows.length ? rows[0].PERAN : null;
}

// PJMK Utama, PJMK Pendamping, atau data lama ("PJMK (Admin Kelas)", "Wakil PJMK")
const isPjmk = (peran) => {
  const p = String(peran || "").toLowerCase();
  return p.includes("pjmk") || p.includes("wakil");
};

function tambahFormatTask(r) {
  const valid = r.DEADLINE instanceof Date && !isNaN(r.DEADLINE.getTime());
  return {
    ...r,
    DEADLINE_FORMATTED: formatIndonesianDeadline(r.DEADLINE),
    DEADLINE_ISO: valid ? r.DEADLINE.toISOString() : r.DEADLINE ? String(r.DEADLINE) : null,
  };
}

// =========================================================================
// GET /tasks/stats?userId=...
// =========================================================================
router.get("/stats", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ pesan: "userId wajib diisi untuk statistik tugas" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         COUNT(DISTINCT t.TASK_ID) AS total_tugas,
         COUNT(DISTINCT CASE WHEN LOWER(st.STATUS) = 'selesai' THEN t.TASK_ID END) AS tugas_selesai,
         COUNT(DISTINCT CASE WHEN (st.STATUS IS NULL OR LOWER(st.STATUS) != 'selesai') AND t.DEADLINE < NOW() THEN t.TASK_ID END) AS tugas_terlambat,
         COUNT(DISTINCT CASE WHEN (st.STATUS IS NULL OR LOWER(st.STATUS) != 'selesai') AND t.DEADLINE >= NOW() THEN t.TASK_ID END) AS tugas_berjalan,
         (SELECT COUNT(*) FROM ANGGOTA_KELAS WHERE USER_ID = ?) AS total_kelas
       FROM TASK t
       JOIN ANGGOTA_KELAS ak ON t.KELAS_ID = ak.KELAS_ID AND ak.USER_ID = ?
       LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?`,
      [userId, userId, userId]
    );

    const stat = rows[0] || {};
    res.json({
      finished: Number(stat.tugas_selesai || 0),
      unfinished: Number(stat.tugas_berjalan || 0),
      overdue: Number(stat.tugas_terlambat || 0),
      totalTasks: Number(stat.total_tugas || 0),
      totalClasses: Number(stat.total_kelas || 0),
    });
  } catch (e) {
    console.error("Gagal mengambil statistik tugas:", e);
    res.status(500).json({ pesan: "Gagal mengambil statistik tugas", error: e.message });
  }
});

// =========================================================================
// GET /tasks?userId=...&kelasId=...  (deadline terdekat lebih dulu)
// =========================================================================
router.get("/", async (req, res) => {
  const { userId, kelasId } = req.query;

  try {
    let sql = "";
    const params = [];

    if (userId) {
      sql = `
        SELECT t.TASK_ID, t.KELAS_ID, t.DIBUAT_OLEH, t.DIUBAH_OLEH, t.JUDUL_TUGAS,
               t.MATA_KULIAH, t.DEADLINE, t.DESKRIPSI, t.UPDATED_AT,
               k.NAMA_KELAS, k.KODE_KELAS,
               u.NAMA AS NAMA_PEMBUAT,
               COALESCE(st.STATUS, 'belum dikerjakan') AS STATUS_USER,
               st.UPDATED_AT AS STATUS_UPDATED_AT
        FROM TASK t
        JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
        JOIN ANGGOTA_KELAS ak ON k.KELAS_ID = ak.KELAS_ID AND ak.USER_ID = ?
        LEFT JOIN USER u ON t.DIBUAT_OLEH = u.USER_ID
        LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?
      `;
      params.push(userId, userId);

      if (kelasId) {
        sql += ` WHERE t.KELAS_ID = ?`;
        params.push(kelasId);
      }
    } else {
      sql = `
        SELECT t.TASK_ID, t.KELAS_ID, t.DIBUAT_OLEH, t.DIUBAH_OLEH, t.JUDUL_TUGAS,
               t.MATA_KULIAH, t.DEADLINE, t.DESKRIPSI, t.UPDATED_AT,
               k.NAMA_KELAS, k.KODE_KELAS
        FROM TASK t
        LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
      `;
      if (kelasId) {
        sql += ` WHERE t.KELAS_ID = ?`;
        params.push(kelasId);
      }
    }

    sql += ` ORDER BY t.DEADLINE ASC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(tambahFormatTask));
  } catch (e) {
    console.error("Gagal mengambil data task:", e);
    res.status(500).json({ pesan: "Gagal mengambil data task", error: e.message });
  }
});

// =========================================================================
// GET /tasks/:id
// =========================================================================
router.get("/:id", async (req, res) => {
  const { userId } = req.query;

  try {
    let sql;
    const params = [];

    if (userId) {
      sql = `SELECT t.*, k.NAMA_KELAS, k.KODE_KELAS,
                    COALESCE(st.STATUS, 'belum dikerjakan') AS STATUS_USER,
                    st.UPDATED_AT AS STATUS_UPDATED_AT
             FROM TASK t
             LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
             LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?
             WHERE t.TASK_ID = ?`;
      params.push(userId, req.params.id);
    } else {
      sql = `SELECT t.*, k.NAMA_KELAS, k.KODE_KELAS
             FROM TASK t
             LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
             WHERE t.TASK_ID = ?`;
      params.push(req.params.id);
    }

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    res.json(tambahFormatTask(rows[0]));
  } catch (e) {
    console.error("Gagal mengambil detail task:", e);
    res.status(500).json({ pesan: "Gagal mengambil detail task", error: e.message });
  }
});

// =========================================================================
// POST /tasks  -> tambah tugas (hanya PJMK kelas tsb)
// =========================================================================
router.post("/", async (req, res) => {
  const { task_id, kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, deadline, deskripsi } = req.body;

  if (!judul_tugas || !mata_kuliah || !deadline || !kelas_id || !dibuat_oleh) {
    return res.status(400).json({
      pesan: "kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, dan deadline wajib diisi",
    });
  }

  const deadlineDate = parseDeadline(deadline);
  if (!deadlineDate) {
    return res.status(400).json({
      pesan: "Format deadline tidak valid. Gunakan tanggal dan jam yang benar.",
    });
  }

  const finalTaskId = task_id || randomUUID();

  try {
    const peran = await getPeran(kelas_id, dibuat_oleh);
    if (!isPjmk(peran)) {
      return res.status(403).json({
        pesan: "Hanya PJMK Utama atau PJMK Pendamping yang dapat menambah tugas.",
      });
    }

    await pool.query(
      `INSERT INTO TASK (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        finalTaskId,
        kelas_id,
        dibuat_oleh,
        judul_tugas.trim(),
        mata_kuliah.trim(),
        deadlineDate,
        deskripsi ? deskripsi.trim() : null,
      ]
    );

    // Notifikasi tugas baru ke anggota lain
    try {
      const [members] = await pool.query(
        `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
        [kelas_id]
      );
      const pesan = `Tugas baru di ${mata_kuliah.trim()}: "${judul_tugas.trim()}" (Deadline: ${formatIndonesianDeadline(deadlineDate)})`;

      for (const m of members) {
        if (m.USER_ID !== dibuat_oleh) {
          await pool.query(
            `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
             VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
            [randomUUID(), finalTaskId, m.USER_ID, "tugas baru", pesan]
          );
        }
      }
    } catch (notifErr) {
      console.warn("Pemberitahuan tugas baru gagal dikirim:", notifErr.message);
    }

    res.status(201).json({
      task_id: finalTaskId,
      kelas_id,
      judul_tugas: judul_tugas.trim(),
      mata_kuliah: mata_kuliah.trim(),
      deadline: deadlineDate.toISOString(),
      deadline_formatted: formatIndonesianDeadline(deadlineDate),
      deskripsi: deskripsi ? deskripsi.trim() : null,
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ pesan: "Tugas dengan ID tersebut sudah ada." });
    }
    console.error("Gagal menambahkan task:", e);
    res.status(500).json({ pesan: "Gagal menambahkan task", error: e.message });
  }
});

// =========================================================================
// PUT /tasks/:id  -> ubah tugas / ubah deadline (hanya PJMK kelas tsb)
// diubah_oleh wajib. Notifikasi hanya dikirim jika deadline berubah.
// =========================================================================
router.put("/:id", async (req, res) => {
  const { diubah_oleh, judul_tugas, mata_kuliah, deadline, deskripsi } = req.body;

  if (!diubah_oleh) {
    return res.status(400).json({ pesan: "diubah_oleh wajib diisi" });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM TASK WHERE TASK_ID = ? LIMIT 1`, [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }
    const lama = rows[0];

    const peran = await getPeran(lama.KELAS_ID, diubah_oleh);
    if (!isPjmk(peran)) {
      return res.status(403).json({
        pesan: "Hanya PJMK Utama atau PJMK Pendamping yang dapat mengubah tugas.",
      });
    }

    // Deadline: pakai yang baru jika dikirim, jika tidak pertahankan yang lama
    let deadlineBaru = lama.DEADLINE;
    let deadlineBerubah = false;

    if (deadline !== undefined && deadline !== null && String(deadline).trim() !== "") {
      const parsed = parseDeadline(deadline);
      if (!parsed) {
        return res.status(400).json({
          pesan: "Format deadline tidak valid. Gunakan tanggal dan jam yang benar.",
        });
      }
      const waktuLama = lama.DEADLINE ? new Date(lama.DEADLINE).getTime() : null;
      deadlineBerubah = waktuLama !== parsed.getTime();
      deadlineBaru = parsed;
    }

    const judulBaru =
      judul_tugas !== undefined && String(judul_tugas).trim() !== ""
        ? String(judul_tugas).trim()
        : lama.JUDUL_TUGAS;
    const mkBaru =
      mata_kuliah !== undefined && String(mata_kuliah).trim() !== ""
        ? String(mata_kuliah).trim()
        : lama.MATA_KULIAH;
    const deskBaru =
      deskripsi !== undefined
        ? deskripsi && String(deskripsi).trim() !== ""
          ? String(deskripsi).trim()
          : null
        : lama.DESKRIPSI;

    // DEADLINE selalu ditulis eksplisit agar tidak ikut ter-reset otomatis oleh MySQL
    await pool.query(
      `UPDATE TASK
       SET JUDUL_TUGAS = ?, MATA_KULIAH = ?, DEADLINE = ?, DESKRIPSI = ?,
           DIUBAH_OLEH = ?, UPDATED_AT = NOW()
       WHERE TASK_ID = ?`,
      [judulBaru, mkBaru, deadlineBaru, deskBaru, diubah_oleh, req.params.id]
    );

    // Notifikasi hanya jika deadline berubah
    if (deadlineBerubah) {
      try {
        const [members] = await pool.query(
          `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
          [lama.KELAS_ID]
        );
        const pesan = `Deadline tugas "${judulBaru}" (${mkBaru}) diubah menjadi ${formatIndonesianDeadline(deadlineBaru)}`;

        for (const m of members) {
          if (m.USER_ID !== diubah_oleh) {
            await pool.query(
              `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
               VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
              [randomUUID(), req.params.id, m.USER_ID, "perubahan deadline", pesan]
            );
          }
        }
      } catch (notifErr) {
        console.warn("Pemberitahuan perubahan deadline gagal dikirim:", notifErr.message);
      }
    }

    res.json({
      pesan: "Tugas berhasil diperbarui",
      task_id: req.params.id,
      judul_tugas: judulBaru,
      mata_kuliah: mkBaru,
      deadline: new Date(deadlineBaru).toISOString(),
      deadline_formatted: formatIndonesianDeadline(deadlineBaru),
      deskripsi: deskBaru,
      deadline_berubah: deadlineBerubah,
    });
  } catch (e) {
    console.error("Gagal memperbarui task:", e);
    res.status(500).json({ pesan: "Gagal memperbarui task", error: e.message });
  }
});

// =========================================================================
// POST /tasks/:id/status  -> ubah status pengerjaan milik user
// body: { user_id, status }
// =========================================================================
router.post("/:id/status", async (req, res) => {
  const { user_id, status } = req.body;

  if (!user_id || !status) {
    return res.status(400).json({ pesan: "user_id dan status wajib diisi" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT KELAS_ID FROM TASK WHERE TASK_ID = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    const peran = await getPeran(rows[0].KELAS_ID, user_id);
    if (!peran) {
      return res.status(403).json({ pesan: "Anda bukan anggota kelas tugas ini." });
    }

    const statusBersih = String(status).trim().toLowerCase();

    const [ada] = await pool.query(
      `SELECT TASK_ID FROM STATUS_TUGAS WHERE TASK_ID = ? AND USER_ID = ? LIMIT 1`,
      [req.params.id, user_id]
    );

    if (ada.length > 0) {
      await pool.query(
        `UPDATE STATUS_TUGAS SET STATUS = ?, UPDATED_AT = NOW() WHERE TASK_ID = ? AND USER_ID = ?`,
        [statusBersih, req.params.id, user_id]
      );
    } else {
      await pool.query(
        `INSERT INTO STATUS_TUGAS (TASK_ID, USER_ID, STATUS, UPDATED_AT) VALUES (?, ?, ?, NOW())`,
        [req.params.id, user_id, statusBersih]
      );
    }

    res.json({
      pesan: "Status pengerjaan diperbarui",
      task_id: req.params.id,
      user_id,
      status: statusBersih,
    });
  } catch (e) {
    console.error("Gagal memperbarui status tugas:", e);
    res.status(500).json({ pesan: "Gagal memperbarui status pengerjaan", error: e.message });
  }
});

// =========================================================================
// DELETE /tasks/:id?oleh=<userId>  -> hapus tugas (hanya PJMK kelas tsb)
// =========================================================================
router.delete("/:id", async (req, res) => {
  const oleh = req.query.oleh;

  if (!oleh) {
    return res.status(400).json({ pesan: "Parameter oleh (userId) wajib diisi" });
  }

  let conn;
  try {
    const [rows] = await pool.query(
      `SELECT KELAS_ID FROM TASK WHERE TASK_ID = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    const peran = await getPeran(rows[0].KELAS_ID, oleh);
    if (!isPjmk(peran)) {
      return res.status(403).json({
        pesan: "Hanya PJMK Utama atau PJMK Pendamping yang dapat menghapus tugas.",
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Hapus data turunan dulu agar tidak terhalang foreign key
    await conn.query(`DELETE FROM NOTIFICATION WHERE TASK_ID = ?`, [req.params.id]);
    await conn.query(`DELETE FROM STATUS_TUGAS WHERE TASK_ID = ?`, [req.params.id]);
    await conn.query(`DELETE FROM TASK WHERE TASK_ID = ?`, [req.params.id]);

    await conn.commit();

    res.json({ pesan: "Tugas berhasil dihapus" });
  } catch (e) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {
        // abaikan
      }
    }
    console.error("Gagal menghapus task:", e);
    res.status(500).json({ pesan: "Gagal menghapus task", error: e.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;