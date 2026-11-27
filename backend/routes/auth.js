import express from "express";
import bcrypt from "bcrypt";
import { randomUUID, randomInt } from "node:crypto";
import { pool } from "../db.js";
import { kirimEmailKode } from "../mailer.js";

const router = express.Router();

// Buat tabel reset password otomatis kalau belum ada
let tabelResetSiap = false;
async function pastikanTabelReset() {
  if (tabelResetSiap) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset (
      ID INT AUTO_INCREMENT PRIMARY KEY,
      USER_ID VARCHAR(36) NOT NULL,
      KODE_HASH VARCHAR(255) NOT NULL,
      EXPIRES_AT DATETIME NOT NULL,
      ATTEMPTS INT NOT NULL DEFAULT 0,
      CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pr_user (USER_ID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tabelResetSiap = true;
}

const pesanServer = (error) =>
  process.env.NODE_ENV === "production"
    ? "Terjadi kesalahan pada server."
    : `Terjadi kesalahan pada server: ${error.message}`;

// Semester valid: 1-14, boleh kosong (null)
function parseSemester(nilai) {
  if (nilai === undefined || nilai === null || String(nilai).trim() === "") {
    return { ok: true, value: null };
  }
  const angka = Number(nilai);
  if (!Number.isInteger(angka) || angka < 1 || angka > 14) {
    return { ok: false, value: null };
  }
  return { ok: true, value: angka };
}

// Rapikan deviceId dari aplikasi (maks 64 karakter sesuai kolom)
const bersihkanDeviceId = (v) => String(v || "").trim().slice(0, 64);

// =========================================================================
// POST /api/auth/register: Pendaftaran Mahasiswa Baru (SRS 6.2)
// Akun baru dibuat tanpa kelas (0 kelas terdaftar) sampai bergabung via kode
// =========================================================================
router.post("/register", async (req, res) => {
  try {
    const { nama, nim, email, password, semester } = req.body;

    if (!nama || !nim || !email || !password) {
      return res.status(400).json({
        pesan: "Semua kolom wajib diisi.",
      });
    }

    let semValue = 1;
    if (semester !== undefined && semester !== null && String(semester).trim() !== "") {
      const sem = parseSemester(semester);
      if (!sem.ok) {
        return res.status(400).json({
          pesan: "Semester harus berupa angka 1 sampai 14.",
        });
      }
      semValue = sem.value || 1;
    }

    const nimBersih = String(nim).trim();
    const emailBersih = String(email).trim().toLowerCase();
    const namaBersih = String(nama).trim();

    const [existingUsers] = await pool.execute(
      "SELECT USER_ID FROM user WHERE NIM = ? OR EMAIL = ?",
      [nimBersih, emailBersih]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        pesan: "NIM atau email sudah terdaftar.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const userId = randomUUID();

    await pool.execute(
      `INSERT INTO user
       (USER_ID, NAMA, NIM, EMAIL, SEMESTER, PASSWORD, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, namaBersih, nimBersih, emailBersih, semValue, hashedPassword]
    );

    return res.status(201).json({
      pesan: "Registrasi berhasil.",
      user: {
        userId,
        nama: namaBersih,
        nim: nimBersih,
        email: emailBersih,
        semester: semValue,
      },
    });
  } catch (error) {
    console.error("Registrasi gagal:", error.message);
    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server.",
    });
  }
});

// =========================================================================
// POST /api/auth/login: Masuk ke Akun (PJMK atau Mahasiswa)
// 1 akun = 1 device. Body: { identitas, password, deviceId, force }
// =========================================================================
router.post("/login", async (req, res) => {
  try {
    const { identitas, password, force } = req.body;
    const deviceId = bersihkanDeviceId(req.body.deviceId);

    if (!identitas || !password) {
      return res.status(400).json({
        pesan: "Email/NIM dan kata sandi wajib diisi.",
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        pesan: "ID perangkat tidak terbaca. Perbarui aplikasi lalu coba lagi.",
      });
    }

    const [users] = await pool.execute(
      `SELECT USER_ID, NAMA, NIM, EMAIL, SEMESTER, FOTO, PASSWORD, ACTIVE_DEVICE_ID
       FROM user
       WHERE NIM = ? OR EMAIL = ?
       LIMIT 1`,
      [String(identitas).trim(), String(identitas).trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        pesan: "Email/NIM atau kata sandi salah.",
      });
    }

    const user = users[0];

    // Mendukung akun lama yang masih menyimpan password teks biasa
    // Akun lama akan otomatis di-upgrade ke bcrypt hash
    let passwordValid = false;

    if (String(user.PASSWORD).startsWith("$2")) {
      passwordValid = await bcrypt.compare(String(password), user.PASSWORD);
    } else {
      passwordValid = String(password) === user.PASSWORD;

      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(String(password), 10);
        await pool.execute("UPDATE user SET PASSWORD = ? WHERE USER_ID = ?", [
          hashedPassword,
          user.USER_ID,
        ]);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        pesan: "Email/NIM atau kata sandi salah.",
      });
    }

    // ===== PEMBATASAN 1 AKUN = 1 DEVICE =====
    // Dicek SETELAH password benar, supaya orang lain tidak bisa
    // mengintip apakah akun sedang dipakai.
    const dipakaiPerangkatLain =
      !!user.ACTIVE_DEVICE_ID && user.ACTIVE_DEVICE_ID !== deviceId;

    if (dipakaiPerangkatLain && force !== true) {
      return res.status(409).json({
        kode: "DEVICE_BUSY",
        pesan:
          "Akun ini sedang dipakai di perangkat lain. Logout dulu di perangkat tersebut.",
      });
    }

    // Kunci akun ke device ini (kalau force, perangkat lama otomatis tertendang
    // saat cek-sesi berikutnya)
    await pool.execute("UPDATE user SET ACTIVE_DEVICE_ID = ? WHERE USER_ID = ?", [
      deviceId,
      user.USER_ID,
    ]);

    // Ambil info peran pada kelas pertama (jika ada) untuk membedakan PJMK vs Mahasiswa
    const [roles] = await pool.query(
      `SELECT PERAN FROM ANGGOTA_KELAS WHERE USER_ID = ? LIMIT 1`,
      [user.USER_ID]
    );
    const role = roles.length > 0 ? roles[0].PERAN : "Mahasiswa";

    return res.status(200).json({
      pesan: "Login berhasil.",
      user: {
        userId: user.USER_ID,
        nama: user.NAMA,
        nim: user.NIM,
        email: user.EMAIL,
        semester: user.SEMESTER ?? null,
        foto: user.FOTO ?? null,
        role: role,
      },
    });
  } catch (error) {
    console.error("Login gagal:", error.message);
    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server.",
    });
  }
});

// =========================================================================
// POST /api/auth/cek-sesi: apakah device ini masih pemegang sesi akun?
// Body: { userId, deviceId } -> { aktif: true/false }
// =========================================================================
router.post("/cek-sesi", async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const deviceId = bersihkanDeviceId(req.body.deviceId);

    if (!userId || !deviceId) {
      return res.status(400).json({ pesan: "userId dan deviceId wajib diisi." });
    }

    const [rows] = await pool.execute(
      "SELECT ACTIVE_DEVICE_ID FROM user WHERE USER_ID = ? LIMIT 1",
      [userId]
    );

    // Akun sudah tidak ada -> sesi tidak valid
    if (rows.length === 0) {
      return res.status(200).json({ aktif: false });
    }

    const aktifId = rows[0].ACTIVE_DEVICE_ID;

    // Kolom masih kosong (mis. user yang sudah login sebelum fitur ini ada):
    // device pertama yang mengecek langsung menjadi pemegang sesi.
    if (!aktifId) {
      await pool.execute(
        "UPDATE user SET ACTIVE_DEVICE_ID = ? WHERE USER_ID = ? AND ACTIVE_DEVICE_ID IS NULL",
        [deviceId, userId]
      );
      const [cek] = await pool.execute(
        "SELECT ACTIVE_DEVICE_ID FROM user WHERE USER_ID = ? LIMIT 1",
        [userId]
      );
      return res
        .status(200)
        .json({ aktif: cek[0]?.ACTIVE_DEVICE_ID === deviceId });
    }

    return res.status(200).json({ aktif: aktifId === deviceId });
  } catch (error) {
    console.error("Cek sesi gagal:", error.message);
    return res.status(500).json({ pesan: "Terjadi kesalahan pada server." });
  }
});

// =========================================================================
// POST /api/auth/logout: lepas kunci device agar akun bisa dipakai HP lain
// Body: { userId, deviceId }. Hanya device pemegang sesi yang bisa melepas.
// =========================================================================
router.post("/logout", async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const deviceId = bersihkanDeviceId(req.body.deviceId);

    if (!userId || !deviceId) {
      return res.status(400).json({ pesan: "userId dan deviceId wajib diisi." });
    }

    await pool.execute(
      "UPDATE user SET ACTIVE_DEVICE_ID = NULL WHERE USER_ID = ? AND ACTIVE_DEVICE_ID = ?",
      [userId, deviceId]
    );

    return res.status(200).json({ pesan: "Logout berhasil." });
  } catch (error) {
    console.error("Logout gagal:", error.message);
    return res.status(500).json({ pesan: "Terjadi kesalahan pada server." });
  }
});

// =========================================================================
// GET /api/auth/profile/:userId: Ambil profil lengkap pengguna
// =========================================================================
router.get("/profile/:userId", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.USER_ID, u.NAMA, u.NIM, u.EMAIL, u.SEMESTER, u.FOTO, u.CREATED_AT,
              (SELECT COUNT(*) FROM ANGGOTA_KELAS ak WHERE ak.USER_ID = u.USER_ID) AS TOTAL_KELAS
       FROM user u
       WHERE u.USER_ID = ?`,
      [req.params.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ pesan: "Pengguna tidak ditemukan" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Gagal mengambil profil:", error.message);
    res.status(500).json({ pesan: "Gagal mengambil profil pengguna" });
  }
});

// =========================================================================
// PUT /api/auth/profile/:userId: Perbarui data profil pengguna
// =========================================================================
router.put("/profile/:userId", async (req, res) => {
  const { nama, email, password, semester, foto } = req.body;

  try {
    const fields = [];
    const params = [];

    if (nama && String(nama).trim().length > 0) {
      fields.push("NAMA = ?");
      params.push(String(nama).trim());
    }

    if (email && String(email).trim().length > 0) {
      const emailBersih = String(email).trim().toLowerCase();

      const [dupe] = await pool.execute(
        "SELECT USER_ID FROM user WHERE EMAIL = ? AND USER_ID <> ? LIMIT 1",
        [emailBersih, req.params.userId]
      );
      if (dupe.length > 0) {
        return res.status(409).json({ pesan: "Email sudah dipakai akun lain." });
      }

      fields.push("EMAIL = ?");
      params.push(emailBersih);
    }

    if (semester !== undefined) {
      const sem = parseSemester(semester);
      if (!sem.ok) {
        return res
          .status(400)
          .json({ pesan: "Semester harus berupa angka 1 sampai 14." });
      }
      fields.push("SEMESTER = ?");
      params.push(sem.value);
    }

    if (foto !== undefined) {
      fields.push("FOTO = ?");
      params.push(foto ? String(foto).trim() : null);
    }

    if (password && String(password).length >= 6) {
      const hashed = await bcrypt.hash(String(password), 10);
      fields.push("PASSWORD = ?");
      params.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ pesan: "Tidak ada data yang diperbarui" });
    }

    const updateSql = `UPDATE user SET ${fields.join(", ")} WHERE USER_ID = ?`;
    params.push(req.params.userId);

    const [hasil] = await pool.execute(updateSql, params);

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: "Pengguna tidak ditemukan" });
    }

    res.json({ pesan: "Profil berhasil diperbarui" });
  } catch (error) {
    console.error("Gagal memperbarui profil:", error.message);
    res.status(500).json({ pesan: "Gagal memperbarui profil pengguna" });
  }
});

// =========================================================================
// POST /api/auth/lupa-password: kirim kode OTP 6 digit ke email terdaftar
// =========================================================================
router.post("/lupa-password", async (req, res) => {
  const pesanUmum = "Jika email terdaftar, kode verifikasi telah dikirim.";

  try {
    await pastikanTabelReset(); // <-- PERBAIKAN: tabel dibuat otomatis

    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ pesan: "Email wajib diisi." });
    }

    const [users] = await pool.execute(
      "SELECT USER_ID, NAMA FROM user WHERE EMAIL = ? LIMIT 1",
      [email]
    );

    // Respons sama baik email terdaftar maupun tidak (mencegah tebak-tebakan email)
    if (users.length === 0) {
      return res.status(200).json({ pesan: pesanUmum });
    }

    const user = users[0];

    // Batasi permintaan: 1 kode per 60 detik per akun
    const [terbaru] = await pool.execute(
      `SELECT ID FROM password_reset
       WHERE USER_ID = ? AND CREATED_AT > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       LIMIT 1`,
      [user.USER_ID]
    );
    if (terbaru.length > 0) {
      return res.status(200).json({ pesan: pesanUmum });
    }

    const kode = String(randomInt(0, 1000000)).padStart(6, "0");
    const kodeHash = await bcrypt.hash(kode, 10);

    // Hapus kode lama, simpan kode baru (berlaku 10 menit)
    await pool.execute("DELETE FROM password_reset WHERE USER_ID = ?", [
      user.USER_ID,
    ]);
    await pool.execute(
      `INSERT INTO password_reset (USER_ID, KODE_HASH, EXPIRES_AT)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [user.USER_ID, kodeHash]
    );

    try {
      await kirimEmailKode(email, user.NAMA, kode);
    } catch (errEmail) {
      console.error("Gagal mengirim email:", errEmail.message);
      await pool.execute("DELETE FROM password_reset WHERE USER_ID = ?", [
        user.USER_ID,
      ]);
      return res.status(500).json({
        pesan: "Gagal mengirim email. Coba lagi nanti.",
      });
    }

    return res.status(200).json({ pesan: pesanUmum });
  } catch (error) {
    console.error("Lupa password gagal:", error.message);
    return res.status(500).json({ pesan: "Terjadi kesalahan pada server." });
  }
});

// =========================================================================
// POST /api/auth/reset-password: verifikasi kode lalu ganti kata sandi
// =========================================================================
router.post("/reset-password", async (req, res) => {
  const pesanSalah = "Kode salah atau sudah kedaluwarsa.";

  try {
    await pastikanTabelReset(); // <-- PERBAIKAN: tabel dibuat otomatis

    const email = (req.body.email || "").trim().toLowerCase();
    const kode = String(req.body.kode || "").trim();
    const passwordBaru = req.body.passwordBaru || "";

    if (!email || !kode || !passwordBaru) {
      return res.status(400).json({ pesan: "Semua kolom wajib diisi." });
    }
    if (!/^\d{6}$/.test(kode)) {
      return res.status(400).json({ pesan: "Kode harus 6 digit angka." });
    }
    if (passwordBaru.length < 8) {
      return res
        .status(400)
        .json({ pesan: "Kata sandi baru minimal 8 karakter." });
    }

    const [users] = await pool.execute(
      "SELECT USER_ID FROM user WHERE EMAIL = ? LIMIT 1",
      [email]
    );
    if (users.length === 0) {
      return res.status(400).json({ pesan: pesanSalah });
    }
    const userId = users[0].USER_ID;

    const [rows] = await pool.execute(
      `SELECT ID, KODE_HASH, ATTEMPTS FROM password_reset
       WHERE USER_ID = ? AND EXPIRES_AT > NOW()
       ORDER BY ID DESC LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) {
      return res.status(400).json({ pesan: pesanSalah });
    }
    const reset = rows[0];

    if (reset.ATTEMPTS >= 5) {
      await pool.execute("DELETE FROM password_reset WHERE USER_ID = ?", [
        userId,
      ]);
      return res.status(400).json({
        pesan: "Terlalu banyak percobaan. Silakan minta kode baru.",
      });
    }

    const valid = await bcrypt.compare(kode, reset.KODE_HASH);
    if (!valid) {
      await pool.execute(
        "UPDATE password_reset SET ATTEMPTS = ATTEMPTS + 1 WHERE ID = ?",
        [reset.ID]
      );
      return res.status(400).json({ pesan: pesanSalah });
    }

    const hashed = await bcrypt.hash(passwordBaru, 10);
    // Sekalian lepas kunci device: kalau lupa sandi karena HP hilang,
    // akun tidak tertahan oleh sesi lama.
    await pool.execute(
      "UPDATE user SET PASSWORD = ?, ACTIVE_DEVICE_ID = NULL WHERE USER_ID = ?",
      [hashed, userId]
    );
    await pool.execute("DELETE FROM password_reset WHERE USER_ID = ?", [
      userId,
    ]);

    return res.status(200).json({
      pesan: "Kata sandi berhasil diubah. Silakan masuk.",
    });
  } catch (error) {
    console.error("Reset password gagal:", error.message);
    return res.status(500).json({ pesan: "Terjadi kesalahan pada server." });
  }
});

export default router;