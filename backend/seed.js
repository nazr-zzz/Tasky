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

    // 2b. Siapkan anggota kelas contoh untuk Teknik Informatika 2021 (sesuai UI Mockup Anggota Kelas)
    const classmates = [
      { id: "u_anindya", nama: "Anindya Putri M", nim: "2108561015", email: "anindya@kampus.ac.id", role: "PJMK Pendamping" },
      { id: "u_bagus", nama: "Bagus Wicaksono", nim: "2108561020", email: "bagus@kampus.ac.id", role: "Mahasiswa" },
      { id: "u_citra", nama: "Citra Dewi Lestari", nim: "2108561033", email: "citra@kampus.ac.id", role: "Mahasiswa" },
      { id: "u_fajar", nama: "Fajar Nugraha", nim: "2108561049", email: "fajar@kampus.ac.id", role: "Mahasiswa" },
    ];

    for (const cm of classmates) {
      const cmPass = await bcrypt.hash("mhs123", 10);
      await pool.query(
        `INSERT INTO user (USER_ID, NAMA, NIM, EMAIL, PASSWORD)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE NAMA = VALUES(NAMA), NIM = VALUES(NIM)`,
        [cm.id, cm.nama, cm.nim, cm.email, cmPass]
      );

      await pool.query(
        `INSERT INTO anggota_kelas (ANGGOTA_ID, USER_ID, KELAS_ID, PERAN)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE PERAN = VALUES(PERAN)`,
        [`ak_k_ti21_${cm.id}`, cm.id, "k_ti21", cm.role]
      );
    }
    console.log("✔ Anggota kelas contoh (k_ti21) siap di database.");

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

    // 4. Masukkan contoh catatan pribadi (US-08)
    const notes = [
      {
        id: "c_1",
        matkul: "Pemrograman Web Lanjut",
        judul: "Catatan Endpoint Login & JWT",
        isi: "Jangan lupa tambahkan library bcrypt untuk hashing password sebelum disimpan ke database. Token expired dibuat 1 jam.",
      },
      {
        id: "c_2",
        matkul: "Basis Data Terdistribusi",
        judul: "Ide Sharding Key",
        isi: "Gunakan user_id dengan hashing MD5 sebagai shard key untuk distribusi data yang merata pada 3 node cluster.",
      },
    ];

    for (const n of notes) {
      await pool.query(
        `INSERT INTO catatan (CATATAN_ID, KELAS_ID, USER_ID, MATA_KULIAH, JUDUL, ISI, UPDATED_AT)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE JUDUL = VALUES(JUDUL), ISI = VALUES(ISI)`,
        [n.id, "k_ti21", pjmkId, n.matkul, n.judul, n.isi]
      );
    }
    console.log("✔ Catatan pribadi awal berhasil disimpan.");

    // 5. Masukkan notifikasi awal sesuai Mockup Notifikasi (US-06 & US-07)
    const notifications = [
      {
        id: "notif_seed_1",
        task_id: "t_pwl_jwt",
        user_id: pjmkId,
        jenis: "H-1",
        pesan: "Tenggat waktu tugas 'Implementasi RESTful API & Autentikasi JWT' berakhir besok pukul 23:59 WIB. Pastikan progres tugas Anda sudah selesai!",
      },
      {
        id: "notif_seed_2",
        task_id: "t_mongodb",
        user_id: pjmkId,
        jenis: "perubahan deadline",
        pesan: "PJMK Dimas Pratama telah memperbarui batas waktu pengumpulan tugas 'Perancangan Skema Sharding & Replikasi MongoDB' menjadi 20 Nov 2024, 23:59 WIB. Alasan: Dispensasi penyesuaian materi koneksi ORM.",
      },
    ];

    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notification (NOTIF_ID, TASK_ID, USER_ID, JENIS, PESAN, WAKTU_KIRIM, IS_READ)
         VALUES (?, ?, ?, ?, ?, NOW(), 0)
         ON DUPLICATE KEY UPDATE PESAN = VALUES(PESAN)`,
        [notif.id, notif.task_id, notif.user_id, notif.jenis, notif.pesan]
      );
    }
    console.log("✔ Notifikasi awal sesuai desain UI/UX berhasil disimpan.");

    console.log("Seeding selesai dengan sukses!");
    process.exit(0);
  } catch (err) {
    console.error("Gagal melakukan seed database:", err);
    process.exit(1);
  }
}

seed();

