import { pool } from "./db.js";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

async function seed() {
  console.log("Memulai penyiapan akun PJMK dan data kelas...");

  try {
    const hashedPassword = await bcrypt.hash("pjmk123", 10);
    const pjmkId = "u_pjmk_dimas";

    // 1. Pastikan akun PJMK (Dimas Pratama) tersedia di tabel user
    await pool.query(
      `INSERT INTO user (USER_ID, NAMA, NIM, EMAIL, PASSWORD)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE NAMA = VALUES(NAMA), NIM = VALUES(NIM), EMAIL = VALUES(EMAIL)`,
      [
        pjmkId,
        "Dimas Pratama",
        "2108561042",
        "pjmk@kampus.ac.id",
        hashedPassword,
      ]
    );
    console.log("✔ Akun PJMK Utama (Dimas Pratama - pjmk@kampus.ac.id / pjmk123) siap.");

    // 1b. Siapkan akun Mahasiswa Baru (Belum Masuk Kelas Manapun / 0 Kelas)
    const mhsHashedPassword = await bcrypt.hash("mhs123", 10);
    const mhsId = "u_mhs_baru_2024";
    await pool.query(
      `INSERT INTO user (USER_ID, NAMA, NIM, EMAIL, PASSWORD)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE NAMA = VALUES(NAMA), NIM = VALUES(NIM), EMAIL = VALUES(EMAIL)`,
      [
        mhsId,
        "Mahasiswa Baru",
        "2108569999",
        "mhsbaru@kampus.ac.id",
        mhsHashedPassword,
      ]
    );
    console.log("✔ Akun Mahasiswa Baru (mhsbaru@kampus.ac.id / mhs123 - 0 Kelas) siap.");

    // 2. Siapkan Kelas yang dikelola oleh PJMK
    const classes = [
      {
        id: "k_ti21",
        name: "Teknik Informatika 2021 - Reguler A",
        code: "TI21-A89K",
      },
      {
        id: "k_simb",
        name: "Sistem Informasi Manajemen - B",
        code: "SIM-B02",
      },
      {
        id: "k_kbds",
        name: "Kecerdasan Buatan & Data Science - 2021",
        code: "KBDS-21",
      },
    ];

    for (const c of classes) {
      await pool.query(
        `INSERT INTO kelas (KELAS_ID, DIBUAT_OLEH, NAMA_KELAS, KODE_KELAS)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE NAMA_KELAS = VALUES(NAMA_KELAS), KODE_KELAS = VALUES(KODE_KELAS)`,
        [c.id, pjmkId, c.name, c.code]
      );

      // Masukkan Dimas Pratama sebagai PJMK di anggota_kelas
      await pool.query(
        `INSERT INTO anggota_kelas (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE PERAN = VALUES(PERAN)`,
        [`ak_${c.id}_pjmk`, pjmkId, c.id, "PJMK (Admin Kelas)"]
      );
    }
    console.log("✔ 3 Kelas PJMK siap di tabel kelas & anggota_kelas.");

    // 3. Masukkan tugas-tugas contoh sesuai dengan UI/UX Figma
    const tasks = [
      {
        id: "t_pwl_jwt",
        kelas_id: "k_ti21",
        judul: "Implementasi RESTful API & Autentikasi JWT",
        matkul: "Pemrograman Web Lanjut",
        deadline: "2026-11-15 23:59:00",
        deskripsi:
          "Buatlah endpoint autentikasi menggunakan format JSON Web Token (JWT) dengan refresh token. Pastikan skema database menyertakan tabel user, role, dan token whitelist.",
      },
      {
        id: "t_mongodb",
        kelas_id: "k_ti21",
        judul: "Perancangan Skema Sharding & Replikasi MongoDB",
        matkul: "Basis Data Terdistribusi",
        deadline: "2026-11-18 17:00:00",
        deskripsi:
          "Simulasi cluster 3 shard dengan mongos router, uji failover saat primary node replica set mati.",
      },
      {
        id: "t_routing",
        kelas_id: "k_ti21",
        judul: "Laporan Praktikum Subnetting CIDR & Routing BGP",
        matkul: "Jaringan Komputer",
        deadline: "2026-11-20 23:59:00",
        deskripsi:
          "Konfigurasi topologi 4 Autonomous System di Cisco Packet Tracer lengkap dengan screenshot tabel routing.",
      },
    ];

    for (const t of tasks) {
      await pool.query(
        `INSERT INTO task (TASK_ID, KELAS_ID, DIBUAT_OLEH, JUDUL_TUGAS, MATA_KULIAH, DEADLINE, DESKRIPSI)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE JUDUL_TUGAS = VALUES(JUDUL_TUGAS), MATA_KULIAH = VALUES(MATA_KULIAH)`,
        [t.id, t.kelas_id, pjmkId, t.judul, t.matkul, t.deadline, t.deskripsi]
      );
    }
    console.log("✔ Tugas-tugas kelas sesuai desain UI/UX baru berhasil disimpan.");

    console.log("Seeding selesai dengan sukses!");
    process.exit(0);
  } catch (err) {
    console.error("Gagal melakukan seed database:", err);
    process.exit(1);
  }
}

seed();

