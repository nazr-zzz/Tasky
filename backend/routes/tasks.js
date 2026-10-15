import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET: Ambil semua daftar task (beserta nama kelas jika di-JOIN)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.TASK_ID, t.JUDUL_TUGAS, t.MATA_KULIAH, t.DEADLINE, t.DESKRIPSI, 
              k.NAMA_KELAS
       FROM TASK t
       LEFT JOIN KELAS k ON t.KELAS_ID = k.KELAS_ID
       ORDER BY t.DEADLINE DESC`,
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: "Gagal mengambil data task" });
  }
});

// GET: Ambil satu task berdasarkan ID (Prepared Statement)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM TASK WHERE TASK_ID = ?", [
      req.params.id,
    ]);
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

  // Validasi kolom wajib berdasarkan struktur tabel
  if (
    !task_id ||
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
          "task_id, kelas_id, dibuat_oleh, judul_tugas, mata_kuliah, dan deadline wajib diisi",
      });
  }

  try {
    await pool.query(
      `INSERT INTO TASK (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        task_id,
        kelas_id,
        dibuat_oleh,
        judul_tugas,
        mata_kuliah,
        deadline,
        deskripsi || null,
      ],
    );

    res.status(201).json({
      task_id,
      kelas_id,
      judul_tugas,
      mata_kuliah,
      deadline,
      deskripsi: deskripsi || null,
    });
  } catch (e) {
    console.error("ERROR ASLI MYSQL:", e); // Tambahkan ini agar error aslinya tercetak jelas
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

// DELETE: Hapus task berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
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
