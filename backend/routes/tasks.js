import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// HELPER: Normalisasi deadline input ke format MySQL DATETIME / TIMESTAMP
// Mendukung format ISO, teks Indonesia ("16 Nov 2024, 23:59 WIB"), dsb.
// =========================================================================
function normalizeDeadline(val) {
  if (!val) return new Date().toISOString().slice(0, 19).replace("T", " ");
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 19).replace("T", " ");
  }

  const str = String(val).trim();

  // Jika format sudah SQL datetime standard (YYYY-MM-DD HH:MM:SS)
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return str.length === 16 ? `${str}:00` : str;
  }

  // Jika format ISO standar (2026-11-15T16:59:00.000Z)
  const isoParsed = new Date(str);
  if (!isNaN(isoParsed.getTime()) && str.includes("-")) {
    return isoParsed.toISOString().slice(0, 19).replace("T", " ");
  }

  // Bersihkan karakter Indonesia (nama hari, simbol •, WIB/WITA/WIT)
  const cleanStr = str
    .replace(/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)[,\s]*/i, "")
    .replace(/[•,]/g, " ")
    .replace(/\s+(wib|wita|wit)$/i, "")
    .trim();

  const monthMap = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, agustus: 7, aug: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9, oct: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, dec: 11,
  };

  // Cocokkan: Tgl Bulan Tahun [Jam:Menit[:Detik]]
  const match = cleanStr.match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (match) {
    const day = parseInt(match[1], 10);
    const mStr = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 23;
    const min = match[5] ? parseInt(match[5], 10) : 59;
    const sec = match[6] ? parseInt(match[6], 10) : 0;

    const month = monthMap[mStr];
    if (month !== undefined) {
      const d = new Date(year, month, day, hour, min, sec);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }

  // Handle format "Besok, 23:59 WIB"
  if (/besok/i.test(str)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
    const h = timeMatch ? parseInt(timeMatch[1], 10) : 23;
    const m = timeMatch ? parseInt(timeMatch[2], 10) : 59;
    d.setHours(h, m, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  // Fallback ke Date parser default atau +3 hari
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 3);
  return fallback.toISOString().slice(0, 19).replace("T", " ");
}

// Format tanggal untuk tampilan UI
function formatIndonesianDeadline(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${dayName}, ${day} ${month} ${year} • ${hours}:${mins} WIB`;
}

// =========================================================================
// GET /tasks/stats: Statistik pengerjaan tugas per pengguna (SRS US-11)
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
// GET /tasks: Ambil daftar task
// - Jika ada userId: HANYA ambil tugas dari kelas yang DI-IKUTI oleh user tsb (SRS M1 / Mahasiswa Baru rule)
// - Diurutkan berdasarkan DEADLINE ASC (deadline terdekat lebih dulu - SRS US-04 / F3)
// =========================================================================
router.get("/", async (req, res) => {
  const { userId, kelasId } = req.query;

  try {
    let sql = "";
    const params = [];

    if (userId) {
      // Hanya ambil tugas pada kelas yang user terdaftar sebagai anggota
      sql = `
        SELECT t.TASK_ID, t.KELAS_ID, t.DIBUAT_OLEH, t.DIUBAH_OLEH, t.JUDUL_TUGAS,
               t.MATA_KULIAH, t.DEADLINE, t.DESKRIPSI, t.UPDATED_AT,
               k.NAMA_KELAS, k.KODE_KELAS,
               COALESCE(st.STATUS, 'belum dikerjakan') AS STATUS_USER,
               st.UPDATED_AT AS STATUS_UPDATED_AT
        FROM TASK t
        JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
        JOIN ANGGOTA_KELAS ak ON k.KELAS_ID = ak.KELAS_ID AND ak.USER_ID = ?
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

    // Urutan prioritas deadline terdekat lebih dulu (US-04 / F3)
    sql += ` ORDER BY t.DEADLINE ASC`;

    const [rows] = await pool.query(sql, params);

    // Format output tanggal yang bersahabat
    const formattedRows = rows.map((r) => {
      const isValidDate = r.DEADLINE instanceof Date && !isNaN(r.DEADLINE.getTime());
      return {
        ...r,
        DEADLINE_FORMATTED: formatIndonesianDeadline(r.DEADLINE),
        DEADLINE_ISO: isValidDate
          ? r.DEADLINE.toISOString()
          : r.DEADLINE
          ? String(r.DEADLINE)
          : null,
      };
    });

    res.json(formattedRows);
  } catch (e) {
    console.error("Gagal mengambil data task:", e);
    res.status(500).json({ pesan: "Gagal mengambil data task", error: e.message });
  }
});

// =========================================================================
// GET /tasks/:id: Ambil satu task berdasarkan ID
// =========================================================================
router.get("/:id", async (req, res) => {
  const { userId } = req.query;

  try {
    let sql = `
      SELECT t.*, k.NAMA_KELAS, k.KODE_KELAS
    `;
    const params = [req.params.id];

    if (userId) {
      sql += `, COALESCE(st.STATUS, 'belum dikerjakan') AS STATUS_USER,
                st.UPDATED_AT AS STATUS_UPDATED_AT
              FROM TASK t
              LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
              LEFT JOIN STATUS_TUGAS st ON t.TASK_ID = st.TASK_ID AND st.USER_ID = ?
              WHERE t.TASK_ID = ?`;
      params.unshift(userId);
    } else {
      sql += ` FROM TASK t
               LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
               WHERE t.TASK_ID = ?`;
    }

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    const task = rows[0];
    const isValidDate = task.DEADLINE instanceof Date && !isNaN(task.DEADLINE.getTime());
    task.DEADLINE_FORMATTED = formatIndonesianDeadline(task.DEADLINE);
    task.DEADLINE_ISO = isValidDate
      ? task.DEADLINE.toISOString()
      : task.DEADLINE
      ? String(task.DEADLINE)
      : null;

    res.json(task);
  } catch (e) {
    console.error("Gagal mengambil detail task:", e);
    res.status(500).json({ pesan: "Gagal mengambil detail task", error: e.message });
  }
});

// =========================================================================
// POST /tasks: Tambah task baru (US-03 / F2)
// =========================================================================
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
    return res.status(400).json({
      pesan: "kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, dan deadline wajib diisi",
    });
  }

  // Normalisasi format deadline ke format MySQL timestamp
  const normalizedDeadline = normalizeDeadline(deadline);

  try {
    await pool.query(
      `INSERT INTO TASK (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        finalTaskId,
        kelas_id,
        dibuat_oleh,
        judul_tugas.trim(),
        mata_kuliah.trim(),
        normalizedDeadline,
        deskripsi ? deskripsi.trim() : null,
      ]
    );

    // Kirim notifikasi tugas baru ke seluruh anggota kelas (SRS US-06)
    try {
      const [members] = await pool.query(
        `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
        [kelas_id]
      );

      for (const m of members) {
        if (m.USER_ID !== dibuat_oleh) {
          await pool.query(
            `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
             VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
            [
              randomUUID(),
              finalTaskId,
              m.USER_ID,
              "tugas baru",
              `Tugas baru di ${mata_kuliah.trim()}: "${judul_tugas.trim()}" (Deadline: ${formatIndonesianDeadline(normalizedDeadline)})`,
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
      judul_tugas: judul_tugas.trim(),
      mata_kuliah: mata_kuliah.trim(),
      deadline: normalizedDeadline,
      deadline_formatted: formatIndonesianDeadline(normalizedDeadline),
      deskripsi: deskripsi ? deskripsi.trim() : null,
    });
  } catch (e) {
    console.error("ERROR ASLI MYSQL:", e);
    res.status(500).json({ pesan: "Gagal menyimpan data task", error_detail: e.message });
  }
});

// =========================================================================
// PUT /tasks/:id: Ubah task / perbarui deadline (US-03, US-07 / F4)
// =========================================================================
router.put("/:id", async (req, res) => {
  const { judul_tugas, mata_kuliah, deadline, deskripsi, diubah_oleh, alasan } =
    req.body;

  if (!judul_tugas || !mata_kuliah || !deadline) {
    return res
      .status(400)
      .json({ pesan: "judul_tugas, mata_kuliah, dan deadline wajib diisi" });
  }

  // Normalisasi format deadline ke format MySQL timestamp
  const normalizedDeadline = normalizeDeadline(deadline);

  try {
    // Ambil info task lama untuk cek apakah deadline diubah
    const [oldTask] = await pool.query(
      `SELECT DEADLINE, KELAS_ID, JUDUL_TUGAS, MATA_KULIAH FROM TASK WHERE TASK_ID = ?`,
      [req.params.id]
    );

    const [hasil] = await pool.query(
      `UPDATE TASK
       SET JUDUL_TUGAS = ?, MATA_KULIAH = ?, DEADLINE = ?, DESKRIPSI = ?, DIUBAH_OLEH = ?
       WHERE TASK_ID = ?`,
      [
        judul_tugas.trim(),
        mata_kuliah.trim(),
        normalizedDeadline,
        deskripsi ? deskripsi.trim() : null,
        diubah_oleh || null,
        req.params.id,
      ]
    );

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: "Data task tidak ditemukan" });
    }

    // Jika deadline berubah, buat notifikasi untuk seluruh anggota kelas (SRS US-07)
    if (oldTask.length > 0) {
      try {
        const oldDeadlineTime = new Date(oldTask[0].DEADLINE).getTime();
        const newDeadlineTime = new Date(normalizedDeadline).getTime();

        // Kirim notifikasi jika deadline diubah atau ada alasan perubahan
        const [members] = await pool.query(
          `SELECT USER_ID FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`,
          [oldTask[0].KELAS_ID]
        );

        const deadlineText = formatIndonesianDeadline(normalizedDeadline);
        const alasanText = alasan && String(alasan).trim().length > 0 ? ` Alasan: ${String(alasan).trim()}` : "";

        for (const m of members) {
          await pool.query(
            `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
             VALUES (?, ?, ?, ?, ?, NOW(), 0)`,
            [
              randomUUID(),
              req.params.id,
              m.USER_ID,
              "perubahan deadline",
              `PJMK telah memperbarui batas waktu pengumpulan tugas "${judul_tugas.trim()}" menjadi ${deadlineText}.${alasanText}`,
            ]
          );
        }
      } catch (notifErr) {
        console.warn("Gagal membuat notifikasi perubahan deadline:", notifErr.message);
      }
    }

    res.json({
      task_id: req.params.id,
      judul_tugas: judul_tugas.trim(),
      mata_kuliah: mata_kuliah.trim(),
      deadline: normalizedDeadline,
      deadline_formatted: formatIndonesianDeadline(normalizedDeadline),
      deskripsi: deskripsi ? deskripsi.trim() : null,
      diubah_oleh: diubah_oleh || null,
    });
  } catch (e) {
    console.error("Gagal memperbarui data task:", e);
    res.status(500).json({ pesan: "Gagal memperbarui data task", error: e.message });
  }
});

// =========================================================================
// POST /tasks/:id/status: Perbarui status tugas untuk user (US-05 / F5)
// =========================================================================
router.post("/:id/status", async (req, res) => {
  const { user_id, status } = req.body;

  if (!user_id || !status) {
    return res.status(400).json({
      pesan: "user_id dan status ('belum dikerjakan' | 'selesai') wajib diisi",
    });
  }

  const normalizedStatus =
    status.toLowerCase() === "selesai" ? "selesai" : "belum dikerjakan";

  try {
    const [existing] = await pool.query(
      `SELECT STATUS_ID FROM STATUS_TUGAS WHERE TASK_ID = ? AND USER_ID = ?`,
      [req.params.id, user_id]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE STATUS_TUGAS SET STATUS = ?, UPDATED_AT = NOW() WHERE TASK_ID = ? AND USER_ID = ?`,
        [normalizedStatus, req.params.id, user_id]
      );
    } else {
      const statusId = randomUUID();
      await pool.query(
        `INSERT INTO STATUS_TUGAS (STATUS_ID, TASK_ID, USER_ID, STATUS, UPDATED_AT)
         VALUES (?, ?, ?, ?, NOW())`,
        [statusId, req.params.id, user_id, normalizedStatus]
      );
    }

    res.json({
      pesan: "Status tugas berhasil diperbarui",
      task_id: req.params.id,
      status: normalizedStatus,
    });
  } catch (e) {
    console.error("Gagal update status tugas:", e);
    res.status(500).json({ pesan: "Gagal mengubah status tugas", error: e.message });
  }
});

// =========================================================================
// DELETE /tasks/:id: Hapus task berdasarkan ID (US-03 / Hak Akses PJMK)
// =========================================================================
router.delete("/:id", async (req, res) => {
  try {
    // Hapus relasi status_tugas dan notifikasi terlebih dahulu agar tidak melanggar foreign key constraint
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
    console.error("Gagal menghapus data task:", e);
    res.status(500).json({ pesan: "Gagal menghapus data task", error: e.message });
  }
});

export default router;
