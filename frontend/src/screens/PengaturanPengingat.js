import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  PILIHAN_HARI,
  PILIHAN_JAM,
  PREF_DEFAULT,
  muatPengaturan,
  simpanPengaturan,
  pastikanIzin,
  kirimNotifikasiUji,
} from "../services/pengingat";

const pad = (n) => String(n).padStart(2, "0");

export default function PengaturanPengingat({ userId, onChanged }) {
  const [pref, setPref] = useState(PREF_DEFAULT);
  const [terbuka, setTerbuka] = useState(false);
  const [siap, setSiap] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!userId) return;
    muatPengaturan(userId).then((p) => {
      setPref(p);
      setSiap(true);
    });
  }, [userId]);

  // Simpan lalu minta dashboard menjadwalkan ulang pengingat
  const terapkan = async (baru) => {
    setPref(baru);
    setMenyimpan(true);
    try {
      await simpanPengaturan(userId, baru);
      if (onChanged) await onChanged();
    } catch (e) {
      Alert.alert("Gagal", "Pengaturan pengingat tidak dapat disimpan.");
    } finally {
      setMenyimpan(false);
    }
  };

  const ubahAktif = async (nilai) => {
    if (nilai) {
      const izin = await pastikanIzin();
      if (!izin) {
        Alert.alert(
          "Izin Notifikasi Ditolak",
          "Aktifkan izin notifikasi untuk Tasky di Pengaturan HP agar pengingat bisa muncul."
        );
        return;
      }
    }
    terapkan({ ...pref, aktif: nilai });
  };

  const ubahHari = (nilai) => {
    const sudah = pref.hari.includes(nilai);
    const hari = sudah ? pref.hari.filter((h) => h !== nilai) : [...pref.hari, nilai];
    terapkan({ ...pref, hari: hari.sort((a, b) => b - a) });
  };

  const ubahJam = (jam) => terapkan({ ...pref, jam });

  const uji = async () => {
    try {
      const ok = await kirimNotifikasiUji();
      if (ok) {
        Alert.alert(
          "Notifikasi uji dijadwalkan",
          "Tutup aplikasi atau kunci layar. Notifikasi akan muncul dalam sekitar 5 detik."
        );
      } else {
        Alert.alert(
          "Izin Notifikasi Ditolak",
          "Aktifkan izin notifikasi untuk Expo Go di Pengaturan HP."
        );
      }
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Notifikasi uji tidak dapat dijadwalkan.");
    }
  };

  if (Platform.OS === "web") return null;
  if (!siap) return null;

  const ringkasan = !pref.aktif
    ? "Nonaktif"
    : pref.hari.length === 0
    ? "Belum ada hari dipilih"
    : `${PILIHAN_HARI.filter((p) => pref.hari.includes(p.nilai))
        .map((p) => p.label)
        .join(", ")} • pukul ${pad(pref.jam)}.00`;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setTerbuka((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⏰</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pengingat Deadline</Text>
          <Text style={styles.subtitle}>{ringkasan}</Text>
        </View>
        {menyimpan ? (
          <ActivityIndicator size="small" color="#073B82" />
        ) : (
          <Text style={styles.chevron}>{terbuka ? "▲" : "▼"}</Text>
        )}
      </TouchableOpacity>

      {terbuka && (
        <View style={styles.body}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Aktifkan pengingat</Text>
            <Switch value={pref.aktif} onValueChange={ubahAktif} />
          </View>

          <View style={{ opacity: pref.aktif ? 1 : 0.4 }} pointerEvents={pref.aktif ? "auto" : "none"}>
            <Text style={styles.label}>Ingatkan saya (boleh pilih lebih dari satu)</Text>
            <View style={styles.chipRow}>
              {PILIHAN_HARI.map((p) => {
                const aktif = pref.hari.includes(p.nilai);
                return (
                  <TouchableOpacity
                    key={p.nilai}
                    style={[styles.chip, aktif && styles.chipAktif]}
                    onPress={() => ubahHari(p.nilai)}
                  >
                    <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>
                      {aktif ? "✓ " : ""}
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Jam pengingat</Text>
            <View style={styles.chipRow}>
              {PILIHAN_JAM.map((j) => {
                const aktif = pref.jam === j;
                return (
                  <TouchableOpacity
                    key={j}
                    style={[styles.chip, aktif && styles.chipAktif]}
                    onPress={() => ubahJam(j)}
                  >
                    <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>
                      {pad(j)}.00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.ujiBtn} onPress={uji}>
              <Text style={styles.ujiBtnText}>Kirim notifikasi uji (5 detik)</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Contoh: H-3 dan H-1 pukul 08.00 → kamu diingatkan 3 hari dan 1 hari sebelum deadline.
              "Hari H" mengingatkan pada jam pilihan di hari deadline (minimal 1 jam sebelum deadline).
              Tugas yang sudah ditandai Selesai tidak akan diingatkan.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden",
  },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
  title: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  chevron: { fontSize: 12, color: "#64748B" },
  body: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  chipAktif: { backgroundColor: "#073B82", borderColor: "#073B82" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  chipTextAktif: { color: "#FFFFFF" },
  ujiBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#073B82",
    alignItems: "center",
  },
  ujiBtnText: { fontSize: 13, fontWeight: "700", color: "#073B82" },
  hint: { fontSize: 11.5, color: "#94A3B8", marginTop: 12, lineHeight: 17 },
});
