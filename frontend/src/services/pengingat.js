import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// =========================================================================
// PENGINGAT DEADLINE (notifikasi lokal)
// Pengguna memilih H-3 / H-2 / H-1 / Hari H (boleh lebih dari satu) dan jam
// pengingat. Notifikasi dijadwalkan di perangkat sendiri, jadi:
//  - tidak butuh server / Firebase
//  - tetap muncul walau HP offline atau aplikasi ditutup
// =========================================================================

export const PILIHAN_HARI = [
  { nilai: 3, label: "H-3" },
  { nilai: 2, label: "H-2" },
  { nilai: 1, label: "H-1" },
  { nilai: 0, label: "Hari H" },
];

export const PILIHAN_JAM = [6, 7, 8, 9, 12, 15, 18, 20];

// Default sesuai SRS US-06: pengingat H-1
export const PREF_DEFAULT = { aktif: true, hari: [1], jam: 8 };

const CHANNEL_ID = "pengingat-tugas";

// Diisi undefined bila pembuatan channel gagal (Android akan memakai channel bawaan)
let channelAktif = CHANNEL_ID;

// iOS hanya mengizinkan 64 notifikasi terjadwal per aplikasi
const BATAS_NOTIFIKASI = 60;

const kunciPref = (userId) => `pengingat:${userId}`;

// Cara notifikasi tampil saat aplikasi sedang dibuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Pilihan pengguna
// ---------------------------------------------------------------------------
export async function muatPengaturan(userId) {
  try {
    const raw = await AsyncStorage.getItem(kunciPref(userId));
    if (!raw) return { ...PREF_DEFAULT };
    const p = JSON.parse(raw);
    return {
      aktif: p.aktif !== false,
      hari: Array.isArray(p.hari) ? p.hari : PREF_DEFAULT.hari,
      jam: Number.isInteger(p.jam) ? p.jam : PREF_DEFAULT.jam,
    };
  } catch {
    return { ...PREF_DEFAULT };
  }
}

export async function simpanPengaturan(userId, pref) {
  await AsyncStorage.setItem(kunciPref(userId), JSON.stringify(pref));
}

// ---------------------------------------------------------------------------
// Izin & channel
// ---------------------------------------------------------------------------
export async function pastikanIzin() {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Pengingat Tugas",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
      channelAktif = CHANNEL_ID;
    } catch (e) {
      // Jangan hentikan fitur hanya karena channel gagal dibuat
      console.warn("Channel notifikasi gagal dibuat, memakai channel bawaan:", e?.message);
      channelAktif = undefined;
    }
  }

  const sekarang = await Notifications.getPermissionsAsync();
  if (sekarang.granted) return true;

  // Android 13+ dan iOS menampilkan dialog izin di sini
  const hasil = await Notifications.requestPermissionsAsync();
  return hasil.granted;
}

// ---------------------------------------------------------------------------
// Penjadwalan
// ---------------------------------------------------------------------------
function waktuPengingat(deadline, hariSebelum, jam) {
  const t = new Date(deadline);
  if (hariSebelum > 0) {
    t.setDate(t.getDate() - hariSebelum);
    t.setHours(jam, 0, 0, 0);
    return t;
  }
  // Hari H: pada jam pilihan, tetapi minimal 1 jam sebelum deadline
  const hariH = new Date(deadline);
  hariH.setHours(jam, 0, 0, 0);
  const satuJamSebelum = new Date(new Date(deadline).getTime() - 3600000);
  return hariH < satuJamSebelum ? hariH : satuJamSebelum;
}

function jamMenit(d) {
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

function teksPengingat(tugas, hariSebelum, deadline) {
  const pukul = jamMenit(new Date(deadline));
  const judul =
    hariSebelum === 0
      ? "Deadline hari ini!"
      : `Deadline ${hariSebelum} hari lagi`;
  const waktu =
    hariSebelum === 0
      ? `hari ini pukul ${pukul}`
      : hariSebelum === 1
      ? `besok pukul ${pukul}`
      : `${hariSebelum} hari lagi, pukul ${pukul}`;
  return {
    title: judul,
    body: `${tugas.subject}: "${tugas.title}" dikumpulkan ${waktu}.`,
  };
}

// Notifikasi uji: muncul 5 detik lagi, untuk memastikan izin & channel sudah benar
export async function kirimNotifikasiUji() {
  if (Platform.OS === "web") return false;
  const izin = await pastikanIzin();
  if (!izin) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tes pengingat Tasky",
      body: "Kalau kamu melihat ini, notifikasi di HP-mu sudah berfungsi.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(channelAktif ? { channelId: channelAktif } : {}),
    },
  });
  return true;
}

// Batalkan semua pengingat (dipakai saat logout)
export async function batalkanSemuaPengingat() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn("Gagal membatalkan pengingat:", e?.message);
  }
}

/**
 * Jadwalkan ulang SEMUA pengingat dari daftar tugas terbaru.
 * Dipanggil setiap kali data tugas berubah (tugas baru, deadline diubah,
 * tugas ditandai selesai, tugas dihapus) atau pilihan H-n diganti.
 * Dengan batal-semua lalu jadwal-ulang, pengingat lama otomatis hilang.
 *
 * @returns {Promise<number>} jumlah pengingat yang berhasil dijadwalkan
 */
export async function sinkronPengingat(tugasList, userId) {
  if (Platform.OS === "web" || !userId) return 0;

  const pref = await muatPengaturan(userId);

  await batalkanSemuaPengingat();

  if (!pref.aktif || pref.hari.length === 0) return 0;

  const izin = await pastikanIzin();
  if (!izin) return 0;

  const sekarang = Date.now();
  const rencana = [];

  for (const tugas of tugasList || []) {
    if (tugas.status === "Selesai") continue;

    const deadline = new Date(tugas.deadline);
    if (isNaN(deadline.getTime()) || deadline.getTime() <= sekarang) continue;

    for (const h of pref.hari) {
      const waktu = waktuPengingat(deadline, h, pref.jam);
      if (waktu.getTime() <= sekarang) continue;
      rencana.push({ tugas, h, waktu, deadline });
    }
  }

  // Ambil yang paling dekat dulu, patuhi batas iOS
  rencana.sort((a, b) => a.waktu - b.waktu);
  const dipilih = rencana.slice(0, BATAS_NOTIFIKASI);

  let berhasil = 0;
  for (const r of dipilih) {
    const { title, body } = teksPengingat(r.tugas, r.h, r.deadline);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { taskId: String(r.tugas.id), screen: "detail-tugas" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.waktu,
          ...(channelAktif ? { channelId: channelAktif } : {}),
        },
      });
      berhasil += 1;
    } catch (e) {
      console.warn("Gagal menjadwalkan pengingat:", e?.message);
    }
  }
  return berhasil;
}
