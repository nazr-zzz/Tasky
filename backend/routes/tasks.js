import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// HELPER
// =========================================================================

function parseDeadline(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();

  // ISO 8601 (dari date picker aplikasi) -> instan waktu yang tepat
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // SQL: YYYY-MM-DD HH:MM[:SS]
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    return isNaN(d.getTime()) ? null : d;
  }

  // Teks Indonesia: "16 Nov 2026, 23:59 WIB"
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

// Format tampilan selalu dalam WIB
function formatIndonesianDeadline(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const p = Object.fromEntries(
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );

  return `${p.weekday}, ${p.day} ${p.month} ${p.year} • ${p.hour}:${p.minute} WIB`;
}

// Poin kunci -> JSON string (undefined = tidak dikirim, null = kosong)
function normalisasiPoin(val) {
  if (val === undefined) return undefined;
  let arr = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch {
      arr = val.split("\n");
    }
  }
  if (!Array.isArray(arr)) return null;
  const bersih = arr.map((x) => String(x).trim()).filter(Boolean).slice(0, 20);
  return bersih.length ? JSON.stringify(bersih) : null;
}

function teksAtauNull(val) {
  if (val === undefined) return undefined;
  const s = String(val ?? "").trim();
  return s === "" ? null : s;
}

async function getPeran(kelasId, userId) {
  if (!kelasId || !userId) return null;
  const [rows] = await pool.query(
    `SELECT PERAN FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ? LIMIT 1`,
    [kelasId, userId]
  );
  return rows.length ? rows[0].PERAN : null;
}

const isPjmk = (peran) => {
  const p = String(peran || "").toLowerCase();
  return p.includes("pjmk") || p.includes("wakil");
};

function tambahFormatTask(r) {
  const valid = r.DEADLINE instanceof Date && !isNaN(r.DEADLINE.getTime());
  let poinList = [];
  if (r.POIN_KUNCI) {
    try {
      const parsed = JSON.parse(r.POIN_KUNCI);
      if (Array.isArray(parsed)) poinList = parsed;
    } catch {
      poinList = String(r.POIN_KUNCI).split("\n").filter(Boolean);
    }
  }
  return {
    ...r,
    POIN_KUNCI_LIST: poinList,
    DEADLINE_FORMATTED: formatIndonesianDeadline(r.DEADLINE),
    DEADLINE_ISO: valid ? r.DEADLINE.toISOString() : r.DEADLINE ? String(r.DEADLINE) : null,
  };
}

const KOLOM_DETAIL = `t.DOSEN, t.MODUL, t.POIN_KUNCI, t.LINK_PENGUMPULAN`;

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
               ${KOLOM_DETAIL},
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
               ${KOLOM_DETAIL},
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
  const {
    task_id, kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, deadline, deskripsi,
    dosen, modul, poin_kunci, link_pengumpulan,
  } = req.body;

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
  const deskripsiBersih = teksAtauNull(deskripsi) ?? null;
  const dosenBersih = teksAtauNull(dosen) ?? null;
  const modulBersih = teksAtauNull(modul) ?? null;
  const linkBersih = teksAtauNull(link_pengumpulan) ?? null;
  const poinBersih = normalisasiPoin(poin_kunci) ?? null;

  try {
    const peran = await getPeran(kelas_id, dibuat_oleh);
    if (!isPjmk(peran)) {
      return res.status(403).json({
        pesan: "Hanya PJMK Utama atau PJMK Pendamping yang dapat menambah tugas.",
      });
    }

    await pool.query(
      `INSERT INTO TASK
         (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI,
          DOSEN, MODUL, POIN_KUNCI, LINK_PENGUMPULAN)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalTaskId,
        kelas_id,
        dibuat_oleh,
        judul_tugas.trim(),
        mata_kuliah.trim(),
        deadlineDate,
        deskripsiBersih,
        dosenBersih,
        modulBersih,
        poinBersih,
        linkBersih,
      ]
    );

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
      deskripsi: deskripsiBersih,
      dosen: dosenBersih,
      modul: modulBersih,
      poin_kunci: poinBersih ? JSON.parse(poinBersih) : [],
      link_pengumpulan: linkBersih,
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
// =========================================================================
router.put("/:id", async (req, res) => {
  const {
    diubah_oleh, judul_tugas, mata_kuliah, deadline, deskripsi,
    dosen, modul, poin_kunci, link_pengumpulan,
  } = req.body;

  if (!diubah_oleh) {
    return res.status(400).json({ pesan: "diubah_oleh wajib diisi" });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM TASK WHERE TASK_ID = ? LIMIT 1`, [req.params.id]);
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

    // Field opsional: undefined = pertahankan, "" = kosongkan
    const deskBaru = deskripsi !== undefined ? teksAtauNull(deskripsi) : lama.DESKRIPSI;
    const dosenBaru = dosen !== undefined ? teksAtauNull(dosen) : lama.DOSEN;
    const modulBaru = modul !== undefined ? teksAtauNull(modul) : lama.MODUL;
    const linkBaru = link_pengumpulan !== undefined ? teksAtauNull(link_pengumpulan) : lama.LINK_PENGUMPULAN;
    const poinNorm = normalisasiPoin(poin_kunci);
    const poinBaru = poinNorm !== undefined ? poinNorm : lama.POIN_KUNCI;

    await pool.query(
      `UPDATE TASK
       SET JUDUL_TUGAS = ?, MATA_KULIAH = ?, DEADLINE = ?, DESKRIPSI = ?,
           DOSEN = ?, MODUL = ?, POIN_KUNCI = ?, LINK_PENGUMPULAN = ?,
           DIUBAH_OLEH = ?, UPDATED_AT = NOW()
       WHERE TASK_ID = ?`,
      [
        judulBaru, mkBaru, deadlineBaru, deskBaru,
        dosenBaru, modulBaru, poinBaru, linkBaru,
        diubah_oleh, req.params.id,
      ]
    );

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
      dosen: dosenBaru,
      modul: modulBaru,
      poin_kunci: poinBaru ? JSON.parse(poinBaru) : [],
      link_pengumpulan: linkBaru,
      deadline_berubah: deadlineBerubah,
    });
  } catch (e) {
    console.error("Gagal memperbarui task:", e);
    res.status(500).json({ pesan: "Gagal memperbarui task", error: e.message });
  }
});

// =========================================================================
// POST /tasks/:id/status
// =========================================================================
router.post("/:id/status", async (req, res) => {
  const { user_id, status } = req.body;

  if (!user_id || !status) {
    return res.status(400).json({ pesan: "user_id dan status wajib diisi" });
  }

  try {
    const [rows] = await pool.query(`SELECT KELAS_ID FROM TASK WHERE TASK_ID = ? LIMIT 1`, [req.params.id]);
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
// DELETE /tasks/:id?oleh=<userId>
// =========================================================================
router.delete("/:id", async (req, res) => {
  const oleh = req.query.oleh;

  if (!oleh) {
    return res.status(400).json({ pesan: "Parameter oleh (userId) wajib diisi" });
  }

  let conn;
  try {
    const [rows] = await pool.query(`SELECT KELAS_ID FROM TASK WHERE TASK_ID = ? LIMIT 1`, [req.params.id]);
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