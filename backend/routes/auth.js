import express from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = express.Router();

// REGISTRASI
router.post("/register", async (req, res) => {
  try {
    const { nama, nim, email, password } = req.body;

    if (!nama || !nim || !email || !password) {
      return res.status(400).json({
        pesan: "Semua kolom wajib diisi.",
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT USER_ID FROM user WHERE NIM = ? OR EMAIL = ?",
      [nim.trim(), email.trim()],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        pesan: "NIM atau email sudah terdaftar.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await pool.execute(
      `INSERT INTO user
       (USER_ID, NAMA, NIM, EMAIL, PASSWORD)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        nama.trim(),
        nim.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
      ],
    );

    return res.status(201).json({
      pesan: "Registrasi berhasil.",
      user: {
        userId,
        nama: nama.trim(),
        nim: nim.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Registrasi gagal:", error.message);

    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identitas, password } = req.body;

    if (!identitas || !password) {
      return res.status(400).json({
        pesan: "Email/NIM dan kata sandi wajib diisi.",
      });
    }

    const [users] = await pool.execute(
      `SELECT USER_ID, NAMA, NIM, EMAIL, PASSWORD
       FROM user
       WHERE NIM = ? OR EMAIL = ?
       LIMIT 1`,
      [identitas.trim(), identitas.trim().toLowerCase()],
    );

    if (users.length === 0) {
      return res.status(401).json({
        pesan: "Email/NIM atau kata sandi salah.",
      });
    }

    const user = users[0];

    // Mendukung akun lama yang masih menyimpan password teks biasa.
    // Akun lama akan diubah ke hash setelah login berhasil.
    let passwordValid = false;

    if (user.PASSWORD.startsWith("$2")) {
      passwordValid = await bcrypt.compare(password, user.PASSWORD);
    } else {
      passwordValid = password === user.PASSWORD;

      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);

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

    return res.status(200).json({
      pesan: "Login berhasil.",
      user: {
        userId: user.USER_ID,
        nama: user.NAMA,
        nim: user.NIM,
        email: user.EMAIL,
      },
    });
  } catch (error) {
    console.error("Login gagal:", error.message);

    return res.status(500).json({
      pesan: "Terjadi kesalahan pada server.",
    });
  }
});

export default router;
