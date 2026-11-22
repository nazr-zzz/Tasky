import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

// =========================================================================
// Pastikan tabel CATATAN ada (aman: tidak menyentuh tabel yang sudah ada)
// =========================================================================
pool
  .query(
    `CREATE TABLE IF NOT EXISTS CATATAN (
       CATATAN_ID  VARCHAR(36)  NOT NULL PRIMARY KEY,
       KELAS_ID    VARCHAR(36)  NULL,
       USER_ID     VARCHAR(64)  NOT NULL,
       MATA_KULIAH VARCHAR(100) NOT NULL DEFAULT 'Umum',
       JUDUL       VARCHAR(255) NOT NULL,
       ISI         TEXT         NOT NULL,
       CREATED_AT  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
       UPDATED_AT  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_catatan_user (USER_ID),
       INDEX idx_catatan_kelas (KELAS_ID)
     )`
  )
  .catch((e) => console.warn("Cek tabel CATATAN dilewati:", e.message));

// =========================================================================
// Helper
// =========================================================================

// Ambil nilai pertama yang terisi dari beberapa nama field (kompatibel
// dengan frontend yang mengirim snake_case maupun camelCase).
const pick = (obj = {}, ...keys) => {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

// Ubah error MySQL menjadi pesan yang jelas untuk frontend.
function sendDbError(res, e, pesanDefault) {
  console.error(`${pesanDefault}:`, e.code, e.message);

  let status = 500;
  let detail = e.message;

  switch (e.code) {
    case "ER_NO_REFERENCED_ROW_2":
    case "ER_NO_REFERENCED_ROW":
      status = 400;
      detail = "user_id atau kelas_id tidak ditemukan di database";
      break;
    case "ER_BAD_NULL_ERROR":
      status = 400;
      detail = "Ada kolom wajib yang kosong (cek kolom KELAS_ID apakah boleh NULL)";
      break;
    case "ER_NO_SUCH_TABLE":
      detail = "Tabel CATATAN tidak ditemukan (cek huruf besar/kecil nama tabel)";
      break;
    case "ER_BAD_FIELD_ERROR":
      detail = "Nama kolom tidak cocok dengan tabel CATATAN: " + e.message;
      break;
    case "ER_DATA_TOO_LONG":
      status = 400;
      detail = "Data terlalu panjang untuk kolom: " + e.message;
      break;
  }

  return res.status(status).json({
    pesan: pesanDefault,
    message: pesanDefault,
    error: detail,
  });
}

// =========================================================================
// GET /api/catatan  -> daftar catatan milik user (SRS US-08)
// =========================================================================
router.get("/", async (req, res) => {
  const targetUserId = pick(req.query, "userId", "user_id");
  const targetKelasId = pick(req.query, "kelasId", "kelas_id");

  if (!targetUserId) {
    return res.status(400).json({ pesan: "userId wajib diisi" });
  }

  try {
    let sql = `SELECT * FROM CATATAN WHERE USER_ID = ?`;
    const params = [String(targetUserId)];

    if (targetKelasId) {
      sql += ` AND KELAS_ID = ?`;
      params.push(String(targetKelasId));
    }

    sql += ` ORDER BY UPDATED_AT DESC`;

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (e) {
    return sendDbError(res, e, "Gagal mengambil catatan");
  }
});

// =========================================================================
// POST /api/catatan  -> buat catatan baru (SRS US-08)
// =========================================================================
router.post("/", async (req, res) => {
  const body = req.body || {};

  const finalUserId = pick(body, "user_id", "userId");
  const finalKelasId = pick(body, "kelas_id", "kelasId") ?? null;
  const isiRaw = pick(body, "isi", "konten", "content", "catatan", "deskripsi");
  const judulRaw = pick(body, "judul", "title");
  const matkulRaw = pick(body, "mata_kuliah", "mataKuliah", "matkul");

  if (!finalUserId) {
    return res.status(400).json({ pesan: "user_id wajib diisi" });
  }
  if (!isiRaw) {
    return res.status(400).json({ pesan: "Isi catatan wajib diisi" });
  }

  const isi = String(isiRaw).trim();
  const matkul = matkulRaw ? String(matkulRaw).trim().slice(0, 100) : "Umum";
  const finalJudul = (
    judulRaw
      ? String(judulRaw).trim()
      : isi.split("\n")[0] || "Catatan Kuliah"
  ).slice(0, 255);

  const catatanId = randomUUID();

  try {
    await pool.query(
      `INSERT INTO CATATAN
         (CATATAN_ID, KELAS_ID, USER_ID, MATA_KULIAH, JUDUL, ISI, UPDATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        catatanId,
        finalKelasId ? String(finalKelasId) : null,
        String(finalUserId),
        matkul,
        finalJudul,
        isi,
      ]
    );

    const catatan = {
      catatan_id: catatanId,
      kelas_id: finalKelasId ? String(finalKelasId) : null,
      user_id: String(finalUserId),
      mata_kuliah: matkul,
      judul: finalJudul,
      isi,
      updated_at: new Date().toISOString(),
    };

    return res.status(201).json({
      pesan: "Catatan berhasil disimpan",
      message: "Catatan berhasil disimpan",
      catatan,
    });
  } catch (e) {
    return sendDbError(res, e, "Gagal menyimpan catatan");
  }
});

// =========================================================================
// PUT /api/catatan/:id  -> perbarui catatan (SRS US-08)
// =========================================================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const finalUserId = pick(body, "user_id", "userId");
  if (!finalUserId) {
    return res.status(400).json({ pesan: "user_id wajib diisi" });
  }

  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const hasMatkul = has("mata_kuliah") || has("mataKuliah");
  const hasJudul = has("judul");
  const hasIsi = has("isi");

  if (!hasMatkul && !hasJudul && !hasIsi) {
    return res.status(400).json({ pesan: "Tidak ada data catatan yang diperbarui" });
  }

  const matkulRaw = body.mata_kuliah ?? body.mataKuliah;

  if (hasJudul && !String(body.judul ?? "").trim()) {
    return res.status(400).json({ pesan: "Judul catatan tidak boleh kosong" });
  }
  if (hasIsi && !String(body.isi ?? "").trim()) {
    return res.status(400).json({ pesan: "Isi catatan tidak boleh kosong" });
  }

  try {
    const [existing] = await pool.query(
      `SELECT CATATAN_ID FROM CATATAN WHERE CATATAN_ID = ? AND USER_ID = ?`,
      [id, String(finalUserId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        pesan: "Catatan tidak ditemukan atau bukan milik Anda",
      });
    }

    const finalMatkul = hasMatkul
      ? String(matkulRaw ?? "").trim().slice(0, 100) || "Umum"
      : null;
    const finalJudul = hasJudul ? String(body.judul).trim().slice(0, 255) : null;
    const finalIsi = hasIsi ? String(body.isi).trim() : null;

    // Catatan: tidak mengecek affectedRows, karena kepemilikan sudah
    // diverifikasi di atas (menghindari 404 palsu bila tidak ada perubahan).
    await pool.query(
      `UPDATE CATATAN
       SET MATA_KULIAH = COALESCE(?, MATA_KULIAH),
           JUDUL       = COALESCE(?, JUDUL),
           ISI         = COALESCE(?, ISI),
           UPDATED_AT  = NOW()
       WHERE CATATAN_ID = ? AND USER_ID = ?`,
      [finalMatkul, finalJudul, finalIsi, id, String(finalUserId)]
    );

    const [updated] = await pool.query(
      `SELECT * FROM CATATAN WHERE CATATAN_ID = ? AND USER_ID = ?`,
      [id, String(finalUserId)]
    );

    return res.status(200).json({
      pesan: "Catatan berhasil diperbarui",
      message: "Catatan berhasil diperbarui",
      catatan: updated[0],
    });
  } catch (e) {
    return sendDbError(res, e, "Gagal memperbarui catatan");
  }
});

// =========================================================================
// DELETE /api/catatan/:id  -> hapus catatan (SRS US-08)
// Kirim ?user_id=... agar hanya pemilik yang bisa menghapus.
// =========================================================================
router.delete("/:id", async (req, res) => {
  const userId = pick(req.query, "user_id", "userId") ?? pick(req.body, "user_id", "userId");

  try {
    let sql = `DELETE FROM CATATAN WHERE CATATAN_ID = ?`;
    const params = [req.params.id];

    if (userId) {
      sql += ` AND USER_ID = ?`;
      params.push(String(userId));
    }

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ pesan: "Catatan tidak ditemukan" });
    }

    return res.status(204).end();
  } catch (e) {
    return sendDbError(res, e, "Gagal menghapus catatan");
  }
});

export default router;