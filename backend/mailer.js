// backend/mailer.js (Gmail SMTP)
import "./env.js";
import nodemailer from "nodemailer";

export async function kirimEmailKode(tujuan, nama, kode) {
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, ""); // App Password tanpa spasi
  const port = Number(process.env.SMTP_PORT || 465);

  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASS belum diisi di backend/.env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Tasky" <${process.env.SMTP_FROM || user}>`,
      to: tujuan,
      subject: "Kode Verifikasi Reset Kata Sandi Tasky",
      text:
        `Halo ${nama},\n\n` +
        `Kode verifikasi untuk reset kata sandi Tasky Anda: ${kode}\n` +
        `Kode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.\n\n` +
        `Jika Anda tidak meminta reset kata sandi, abaikan email ini.`,
      html:
        `<div style="font-family:Arial,sans-serif;max-width:420px">` +
        `<h2 style="color:#073B82">Tasky</h2>` +
        `<p>Halo ${nama},</p>` +
        `<p>Kode verifikasi untuk reset kata sandi Anda:</p>` +
        `<p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#102A36">${kode}</p>` +
        `<p>Kode berlaku selama <b>10 menit</b>. Jangan bagikan kode ini kepada siapa pun.</p>` +
        `<p style="color:#64748B;font-size:12px">Jika Anda tidak meminta reset kata sandi, abaikan email ini.</p>` +
        `</div>`,
    });
  } catch (err) {
    console.error("GAGAL KIRIM EMAIL:", err.code, err.message);
    throw err;
  }
}