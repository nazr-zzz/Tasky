import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

const PERAN_UTAMA = "PJMK Utama";
const PERAN_PENDAMPING = "PJMK Pendamping";
const PERAN_MHS = "Mahasiswa";

// Ambil peran user di sebuah kelas (null jika bukan anggota)
async function getPeran(kelasId, userId) {
  if (!kelasId || !userId) return null;
  const [rows] = await pool.query(
    `SELECT PERAN FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ? LIMIT 1`,
    [kelasId, userId]
  );
  return rows.length ? rows[0].PERAN : null;
}

const isUtama = (peran) => String(peran || "").toLowerCase().includes("pjmk utama");

// Buat kode kelas unik 6 karakter
async function buatKodeUnik(kodeUsulan) {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const acak = () =>
    Array.from({ length: 6 }, () => huruf[Math.floor(Math.random() * huruf.length)]).join("");

  let kode = kodeUsulan && kodeUsulan.trim() ? kodeUsulan.trim().toUpperCase() : acak();
  for (let i = 0; i < 10; i++) {
    const [ada] = await pool.query(
      `SELECT 1 FROM KELAS WHERE UPPER(KODE_KELAS) = ? LIMIT 1`,
      [kode]
    );
    if (ada.length === 0) return kode;
    kode = acak();
  }
  throw new Error("Gagal membuat kode kelas unik, coba lagi.");
}

// =========================================================================
// GET /api/kelas?userId=...  -> daftar kelas milik user
// =========================================================================
router.get("/", async (req, res) => {
  const { userId, user_id } = req.query;
  const targetUserId = userId || user_id;

  try {
    if (targetUserId) {
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
// GET /api/kelas/:id/anggota
// (diletakkan sebelum "/:id" agar tidak ambigu)
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
           WHEN ak.PERAN LIKE '%PJMK Utama%' THEN 1
           WHEN ak.PERAN LIKE '%PJMK%' THEN 2
           WHEN ak.PERAN LIKE '%wakil%' OR ak.PERAN LIKE '%pendamping%' THEN 3
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
// GET /api/kelas/:id -> detail kelas
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
// POST /api/kelas -> buat kelas baru
// - Nama kelas tidak boleh sama dengan kelas yang sudah ada (409)
// - Pembuat otomatis menjadi PJMK Utama
// =========================================================================
router.post("/", async (req, res) => {
  const { nama_kelas, kode_kelas, dibuat_oleh } = req.body;

  if (!nama_kelas || !nama_kelas.trim() || !dibuat_oleh) {
    return res.status(400).json({ pesan: "nama_kelas dan dibuat_oleh wajib diisi" });
  }

  const namaBersih = nama_kelas.trim().replace(/\s+/g, " ");
  const conn = await pool.getConnection();

  try {
    // User pembuat harus benar-benar terdaftar
    const [userRows] = await conn.query(
      `SELECT USER_ID FROM USER WHERE USER_ID = ?`,
      [dibuat_oleh]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ pesan: "Akun tidak ditemukan. Silakan login ulang." });
    }

    // Tolak nama kelas ganda (tanpa membedakan huruf besar/kecil dan spasi ganda)
    const [duplikat] = await conn.query(
      `SELECT KELAS_ID FROM KELAS
       WHERE LOWER(TRIM(NAMA_KELAS)) = LOWER(?) LIMIT 1`,
      [namaBersih]
    );
    if (duplikat.length > 0) {
      return res.status(409).json({
        pesan:
          "Kelas dengan nama ini sudah ada. Minta kode kelas ke PJMK lalu gunakan Gabung Kelas. " +
          "Untuk kelas paralel, beri nama berbeda (contoh: 'Basis Data - Kelas B').",
      });
    }

    const finalKode = await buatKodeUnik(kode_kelas);
    const kelasId = randomUUID();
    const anggotaId = randomUUID();

    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO KELAS (KELAS_ID, DIBUAT_OLEH, NAMA_KELAS, KODE_KELAS, CREATED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [kelasId, dibuat_oleh, namaBersih, finalKode]
    );
    await conn.query(
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN, JOINED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [anggotaId, dibuat_oleh, kelasId, PERAN_UTAMA]
    );
    await conn.commit();

    res.status(201).json({
      pesan: "Kelas berhasil dibuat",
      kelas: {
        kelas_id: kelasId,
        nama_kelas: namaBersih,
        kode_kelas: finalKode,
        dibuat_oleh,
        peran: PERAN_UTAMA,
      },
    });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error("Gagal membuat kelas:", e);
    res.status(500).json({ pesan: "Gagal membuat kelas", error: e.message });
  } finally {
    conn.release();
  }
});

// =========================================================================
// POST /api/kelas/join -> gabung kelas dengan kode
// =========================================================================
router.post("/join", async (req, res) => {
  const { kode_kelas, user_id, userId } = req.body;
  const finalUserId = user_id || userId;

  if (!kode_kelas || !finalUserId) {
    return res.status(400).json({ pesan: "kode_kelas dan user_id wajib diisi" });
  }

  try {
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

    const [userRows] = await pool.query(
      `SELECT USER_ID FROM USER WHERE USER_ID = ?`,
      [finalUserId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ pesan: "Akun tidak ditemukan. Silakan login ulang." });
    }

    const [existing] = await pool.query(
      `SELECT 1 FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ?`,
      [targetKelas.KELAS_ID, finalUserId]
    );
    if (existing.length > 0) {
      return res.status(200).json({
        pesan: "Anda sudah terdaftar di kelas ini.",
        kelas: targetKelas,
      });
    }

    await pool.query(
      `INSERT INTO ANGGOTA_KELAS (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN, JOINED_AT)
       VALUES (?, ?, ?, ?, NOW())`,
      [randomUUID(), finalUserId, targetKelas.KELAS_ID, PERAN_MHS]
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
// PUT /api/kelas/:id/anggota/:userId/peran
// Hanya PJMK Utama. Body: { peran, oleh }
// =========================================================================
router.put("/:id/anggota/:userId/peran", async (req, res) => {
  const { peran, oleh } = req.body;
  const { id, userId } = req.params;

  if (!peran || !oleh) {
    return res.status(400).json({ pesan: "peran dan oleh (id pengguna yang mengubah) wajib diisi" });
  }

  if (![PERAN_PENDAMPING, PERAN_MHS].includes(peran)) {
    return res.status(400).json({
      pesan: `Peran hanya boleh '${PERAN_PENDAMPING}' atau '${PERAN_MHS}'.`,
    });
  }

  try {
    const peranPengubah = await getPeran(id, oleh);
    if (!isUtama(peranPengubah)) {
      return res.status(403).json({ pesan: "Hanya PJMK Utama yang dapat mengubah peran anggota." });
    }

    const peranTarget = await getPeran(id, userId);
    if (!peranTarget) {
      return res.status(404).json({ pesan: "Anggota kelas tidak ditemukan" });
    }
    if (isUtama(peranTarget)) {
      return res.status(400).json({ pesan: "Peran PJMK Utama tidak dapat diubah." });
    }

    await pool.query(
      `UPDATE ANGGOTA_KELAS SET PERAN = ? WHERE KELAS_ID = ? AND USER_ID = ?`,
      [peran, id, userId]
    );

    // Notifikasi ke anggota yang diubah perannya
    try {
      const [kRows] = await pool.query(`SELECT NAMA_KELAS FROM KELAS WHERE KELAS_ID = ?`, [id]);
      const namaKelas = kRows[0]?.NAMA_KELAS || "Kelas";
      const pesan =
        peran === PERAN_PENDAMPING
          ? `Selamat! Peran Anda di kelas "${namaKelas}" telah diperbarui menjadi ${peran}. Anda kini memiliki hak untuk menambah dan mengelola tugas perkuliahan.`
          : `Peran Anda di kelas "${namaKelas}" kini menjadi ${peran}.`;

      await pool.query(
        `INSERT INTO NOTIFICATION (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
         VALUES (?, NULL, ?, 'info', ?, NOW(), 0)`,
        [randomUUID(), userId, pesan]
      );
    } catch (notifErr) {
      console.warn("Gagal membuat notifikasi perubahan peran:", notifErr.message);
    }

    res.json({ pesan: "Peran anggota berhasil diperbarui", peran });
  } catch (e) {
    console.error("Gagal mengubah peran anggota:", e);
    res.status(500).json({ pesan: "Gagal mengubah peran", error: e.message });
  }
});

// =========================================================================
// DELETE /api/kelas/:id/anggota/:userId?oleh=...
// - Anggota boleh keluar sendiri (oleh == userId), kecuali PJMK Utama
// - PJMK Utama boleh mengeluarkan anggota lain
// =========================================================================
router.delete("/:id/anggota/:userId", async (req, res) => {
  const { id, userId } = req.params;
  const oleh = req.query.oleh || req.body?.oleh || userId; // default: keluar sendiri

  try {
    const peranTarget = await getPeran(id, userId);
    if (!peranTarget) {
      return res.status(404).json({ pesan: "Anggota kelas tidak ditemukan" });
    }

    if (isUtama(peranTarget)) {
      return res.status(400).json({
        pesan: "PJMK Utama tidak dapat keluar dari kelas. Hapus kelas jika sudah tidak dipakai.",
      });
    }

    if (String(oleh) !== String(userId)) {
      const peranPengubah = await getPeran(id, oleh);
      if (!isUtama(peranPengubah)) {
        return res.status(403).json({ pesan: "Hanya PJMK Utama yang dapat mengeluarkan anggota." });
      }
    }

    await pool.query(
      `DELETE FROM STATUS_TUGAS
       WHERE USER_ID = ? AND TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [userId, id]
    );
    await pool.query(`DELETE FROM ANGGOTA_KELAS WHERE KELAS_ID = ? AND USER_ID = ?`, [id, userId]);

    res.json({ pesan: "Berhasil keluar dari kelas", kelas_id: id, user_id: userId });
  } catch (e) {
    console.error("Gagal keluar dari kelas:", e);
    res.status(500).json({ pesan: "Gagal keluar dari kelas", error: e.message });
  }
});

// =========================================================================
// DELETE /api/kelas/:id?oleh=...  -> hanya PJMK Utama
// =========================================================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const oleh = req.query.oleh || req.body?.oleh;

  if (!oleh) {
    return res.status(400).json({ pesan: "Parameter oleh (id pengguna) wajib diisi" });
  }

  const conn = await pool.getConnection();
  try {
    const peran = await getPeran(id, oleh);
    if (!isUtama(peran)) {
      return res.status(403).json({ pesan: "Hanya PJMK Utama yang dapat menghapus kelas." });
    }

    await conn.beginTransaction();
    await conn.query(
      `DELETE FROM STATUS_TUGAS WHERE TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [id]
    );
    await conn.query(
      `DELETE FROM NOTIFICATION WHERE TASK_ID IN (SELECT TASK_ID FROM TASK WHERE KELAS_ID = ?)`,
      [id]
    );
    await conn.query(`DELETE FROM TASK WHERE KELAS_ID = ?`, [id]);
    await conn.query(`DELETE FROM CATATAN WHERE KELAS_ID = ?`, [id]);
    await conn.query(`DELETE FROM ANGGOTA_KELAS WHERE KELAS_ID = ?`, [id]);
    const [result] = await conn.query(`DELETE FROM KELAS WHERE KELAS_ID = ?`, [id]);
    await conn.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Kelas tidak ditemukan" });
    }
    res.json({ pesan: "Kelas dan seluruh tugas terkait berhasil dihapus" });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error("Gagal menghapus kelas:", e);
    res.status(500).json({ pesan: "Gagal menghapus kelas", error: e.message });
  } finally {
    conn.release();
  }
});

export default router;