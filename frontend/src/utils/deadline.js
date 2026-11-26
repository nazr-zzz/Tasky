const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Ambil nilai pertama yang terisi dari beberapa kemungkinan nama field
export const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

export function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Deadline asli (ISO) dari data tugas
export function getTaskDeadlineDate(task) {
  return toDate(pick(task, "deadlineIso", "deadline_iso", "DEADLINE_ISO"));
}

function zonaWaktu(d) {
  const off = -d.getTimezoneOffset();
  if (off === 420) return "WIB";
  if (off === 480) return "WITA";
  if (off === 540) return "WIT";
  return "";
}

export const formatTanggal = (d) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
export const formatJam = (d) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function formatDeadline(d) {
  return `${HARI[d.getDay()]}, ${formatTanggal(d)} • ${formatJam(d)} ${zonaWaktu(d)}`.trim();
}

// Teks deadline sesuai input pengguna; fallback ke teks lama bila ISO tidak ada
export function getDeadlineText(task) {
  const d = getTaskDeadlineDate(task);
  if (d) return formatDeadline(d);
  return pick(task, "deadline", "DEADLINE_FORMATTED") || "-";
}

// Hitung mundur dinamis berdasarkan deadline
export function formatCountdown(d, now = new Date()) {
  if (!d) return null;
  const diff = d.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const hari = Math.floor(abs / 86400000);
  const jam = Math.floor((abs % 86400000) / 3600000);
  const menit = Math.floor((abs % 3600000) / 60000);

  let teks;
  if (hari > 0) teks = `${hari} Hari ${jam} Jam`;
  else if (jam > 0) teks = `${jam} Jam ${menit} Menit`;
  else teks = `${menit} Menit`;

  return diff < 0 ? { text: `Terlambat ${teks}`, overdue: true } : { text: teks, overdue: false };
}

// Poin kunci bisa berupa array, JSON string, atau teks per baris
export function parsePoin(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
  } catch {}
  return String(val).split("\n").map((s) => s.trim()).filter(Boolean);
}