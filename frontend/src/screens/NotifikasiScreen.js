import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";

// =========================================================================
// HELPER: pemetaan data notifikasi dari server
// =========================================================================

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// Ubah tanggal menjadi teks relatif ("5 menit yang lalu") atau tanggal singkat
function waktuRelatif(nilai) {
  if (!nilai) return "";
  const d = new Date(nilai);
  if (isNaN(d.getTime())) return String(nilai);
  const detik = Math.floor((Date.now() - d.getTime()) / 1000);
  if (detik < 60) return "Baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit yang lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam yang lalu`;
  if (detik < 172800) return "Kemarin";
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// Kelompokkan tipe notifikasi dari server menjadi 3 jenis tampilan
function normalisasiTipe(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("ubah") || s.includes("change") || s.includes("perubahan")) {
    return "deadline_changed";
  }
  if (
    s.includes("h-1") ||
    s.includes("h1") ||
    s.includes("remind") ||
    s.includes("ingat") ||
    s.includes("deadline")
  ) {
    return "deadline_h1";
  }
  return "info";
}

const TIPE_META = {
  deadline_h1: { label: "PENGINGAT DEADLINE", icon: "⏰", bg: "#FEE2E2" },
  deadline_changed: { label: "PERUBAHAN DEADLINE DARI PJMK", icon: "📅", bg: "#EFF6FF" },
  info: { label: "INFORMASI", icon: "🔔", bg: "#F1F5F9" },
};

const adalahBenar = (v) =>
  v === 1 || v === true || v === "1" || v === "Y" || v === "y" || v === "true";

function mapNotif(n) {
  const tipe = normalisasiTipe(n.TIPE ?? n.tipe ?? n.JENIS ?? n.jenis ?? n.type);
  const meta = TIPE_META[tipe];

  // Penanda sudah dibaca: coba beberapa kemungkinan nama field
  const flag =
    n.DIBACA ?? n.dibaca ?? n.IS_READ ?? n.is_read ?? n.SUDAH_DIBACA ?? n.sudah_dibaca;
  const isUnread = flag === undefined ? false : !adalahBenar(flag);

  const judul = n.JUDUL ?? n.judul ?? n.TITLE ?? n.title;

  return {
    id: n.NOTIF_ID ?? n.notif_id ?? n.id,
    type: tipe,
    titleLabel: String(judul || meta.label).toUpperCase(),
    time: waktuRelatif(n.CREATED_AT ?? n.created_at ?? n.WAKTU ?? n.waktu ?? n.TANGGAL),
    isUnread,
    message: n.PESAN ?? n.pesan ?? n.ISI ?? n.isi ?? n.message ?? "",
    taskId: n.TASK_ID ?? n.task_id ?? n.TUGAS_ID ?? n.tugas_id,
    matkulTag: n.MATA_KULIAH ?? n.mata_kuliah,
    subTag: n.JUDUL_TUGAS ?? n.judul_tugas,
    reason: n.ALASAN ?? n.alasan,
    icon: meta.icon,
    iconBg: meta.bg,
  };
}

export default function NotifikasiScreen({ currentUser, onOpenTask }) {
  const userId = currentUser?.userId;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setError("");
    try {
      const data = await fetchNotifications(userId);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list.map(mapNotif));
    } catch (e) {
      setError(e?.message || "Gagal memuat notifikasi.");
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadNotifications().finally(() => setLoading(false));
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Tandai semua dibaca: kirim ke server dulu, ubah tampilan hanya jika berhasil
  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const ok = await markAllNotificationsRead(userId);
      if (!ok) throw new Error("Server menolak permintaan.");
      setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
      Alert.alert("Sukses", "Semua notifikasi telah ditandai telah dibaca.");
    } catch (e) {
      Alert.alert("Gagal", e?.message || "Tidak dapat terhubung ke server.");
    } finally {
      setMarkingAll(false);
    }
  };

  // Buka tugas terkait; tandai notifikasi dibaca di server bila masih baru
  const handleOpenTask = async (item) => {
    if (item.isUnread) {
      try {
        const ok = await markNotificationRead(item.id);
        if (ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
          );
        }
      } catch (e) {
        // Gagal menandai dibaca tidak menghalangi membuka tugas
      }
    }
    if (onOpenTask) onOpenTask(item);
  };

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* HEADER SECTION: NOTIFIKASI [N BARU] & TANDAI DIBACA */}
      <View style={styles.topHeaderRow}>
        <View style={styles.titleWithCount}>
          <Text style={styles.mainTitle}>Notifikasi</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount} Baru</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll}>
            <Text style={[styles.markReadBtn, markingAll && { opacity: 0.5 }]}>
              ✓ Tandai Semua Dibaca
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* STATUS: MEMUAT / ERROR / KOSONG / DAFTAR */}
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#073B82" />
          <Text style={styles.stateText}>Memuat notifikasi dari server...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Gagal Memuat Notifikasi</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>🔄 Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.stateText}>Belum ada notifikasi.</Text>
        </View>
      ) : (
        notifications.map((item) => (
          <View
            key={String(item.id)}
            style={[styles.notifCard, item.isUnread && styles.notifCardUnread]}
          >
            <View style={styles.notifTopRow}>
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconStyle}>{item.icon}</Text>
              </View>

              <View style={styles.metaCol}>
                <View style={styles.labelTimeRow}>
                  <Text
                    style={[
                      styles.typeLabel,
                      item.type === "deadline_h1"
                        ? styles.typeRed
                        : item.type === "deadline_changed"
                        ? styles.typeBlue
                        : styles.typeGrey,
                    ]}
                    numberOfLines={1}
                  >
                    {item.titleLabel}
                  </Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <Text style={styles.messageText}>{item.message}</Text>

                {/* TAG MATA KULIAH (JIKA ADA) */}
                {(item.matkulTag || item.subTag) && (
                  <View style={styles.tagsRow}>
                    {item.matkulTag ? (
                      <Text style={styles.tagItem}>📁 {item.matkulTag}</Text>
                    ) : null}
                    {item.subTag ? (
                      <Text style={styles.tagItem} numberOfLines={1}>
                        {item.subTag}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* ALASAN PERUBAHAN (JIKA ADA) */}
                {item.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>
                      Alasan Perubahan: "{item.reason}"
                    </Text>
                  </View>
                ) : null}

                {/* TOMBOL AKSI (HANYA JIKA TERKAIT TUGAS) */}
                {item.taskId !== undefined && item.type === "deadline_h1" && (
                  <TouchableOpacity
                    style={styles.openTaskBtn}
                    onPress={() => handleOpenTask(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openTaskBtnText}>Buka Tugas</Text>
                  </TouchableOpacity>
                )}

                {item.taskId !== undefined && item.type === "deadline_changed" && (
                  <TouchableOpacity
                    style={styles.scheduleLink}
                    onPress={() => handleOpenTask(item)}
                  >
                    <Text style={styles.scheduleLinkText}>🔍 Cek Detail Jadwal</Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.isUnread && <View style={styles.unreadDot} />}
            </View>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 24,
  },
  titleWithCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#102A36",
  },
  countBadge: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  markReadBtn: {
    fontSize: 12,
    color: "#073B82",
    fontWeight: "700",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 36,
  },
  stateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B91C1C",
  },
  errorDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#073B82",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  notifCardUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FBFDFF",
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconStyle: {
    fontSize: 18,
  },
  metaCol: {
    flex: 1,
  },
  labelTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  typeLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  typeRed: {
    color: "#DC2626",
  },
  typeBlue: {
    color: "#1D4ED8",
  },
  typeGrey: {
    color: "#64748B",
  },
  timeText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  messageText: {
    fontSize: 12,
    color: "#1E293B",
    lineHeight: 18,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tagItem: {
    fontSize: 10,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  reasonBox: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 11,
    color: "#475467",
    fontStyle: "italic",
  },
  openTaskBtn: {
    backgroundColor: "#073B82",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  openTaskBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  scheduleLink: {
    alignSelf: "flex-start",
  },
  scheduleLinkText: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 6,
    marginTop: 4,
  },
});