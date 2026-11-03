import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function NotifikasiScreen({
  currentUser,
  onOpenTask,
}) {
  const [notifications, setNotifications] = useState([
    {
      id: "notif_1",
      type: "deadline_h1",
      titleLabel: "PENGINGAT H-1 DEADLINE",
      time: "15 Menit yang lalu",
      isUnread: true,
      message:
        "Tenggat waktu tugas 'Implementasi RESTful API & Autentikasi JWT' berakhir besok pukul 23:59 WIB. Pastikan progres tugas Anda sudah selesai!",
      matkulTag: "Pemrograman Web Lanjut",
      subTag: "Implementasi RESTful API & Aut",
      icon: "⏰",
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
    },
    {
      id: "notif_2",
      type: "deadline_changed",
      titleLabel: "PERUBAHAN DEADLINE DARI PJMK",
      time: "2 Jam yang lalu",
      isUnread: false,
      message:
        "PJMK Dimas Pratama telah memperbarui batas waktu pengumpulan tugas 'Perancangan Skema Sharding & Replikasi MongoDB' menjadi 20 Nov 2024, 23:59 WIB.",
      reason: "Dispensasi penyesuaian materi koneksi ORM.",
      icon: "📅",
      iconBg: "#EFF6FF",
      iconColor: "#1D4ED8",
    },
    {
      id: "notif_3",
      type: "deadline_past",
      titleLabel: "PENGINGAT H-1 DEADLINE",
      time: "Kemarin",
      isUnread: false,
      message:
        "Tugas 'Kuis Algoritma Pemrograman' akan ditutup malam ini pukul 23:59 WIB.",
      sentStatus: "✔ Telah Terkirim",
      icon: "🔔",
      iconBg: "#F1F5F9",
      iconColor: "#64748B",
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    Alert.alert("Sukses", "Semua notifikasi telah ditandai telah dibaca.");
  };

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* STRIP MODE OFFLINE */}
      <View style={styles.offlineStrip}>
        <Text style={styles.offlineStripText}>
          ⚠️ Mode Offline • Perubahan akan disinkronkan saat online 🔸
        </Text>
      </View>

      {/* HEADER SECTION: NOTIFIKASI [1 BARU] & TANDAI DIBACA */}
      <View style={styles.topHeaderRow}>
        <View style={styles.titleWithCount}>
          <Text style={styles.mainTitle}>Notifikasi</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount} Baru</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadBtn}>✓ Tandai Semua Dibaca</Text>
        </TouchableOpacity>
      </View>

      {/* BANNER ALARM LOKAL MANDIRI */}
      <View style={styles.alarmBanner}>
        <Text style={styles.alarmIcon}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.alarmTitle}>Alarm Lokal Mandiri</Text>
          <Text style={styles.alarmSub}>
            Pemberitahuan terjadwal aktif secara lokal
          </Text>
        </View>
        <View style={styles.activeDot} />
      </View>

      {/* LIST NOTIFIKASI */}
      {notifications.map((item) => (
        <View
          key={item.id}
          style={[
            styles.notifCard,
            item.isUnread && styles.notifCardUnread,
          ]}
        >
          <View style={styles.notifTopRow}>
            <View
              style={[styles.iconContainer, { backgroundColor: item.iconBg }]}
            >
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
                >
                  {item.titleLabel}
                </Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              <Text style={styles.messageText}>{item.message}</Text>

              {/* JIKA ADA TAG MATA KULIAH */}
              {item.matkulTag && (
                <View style={styles.tagsRow}>
                  <Text style={styles.tagItem}>📁 {item.matkulTag} ›</Text>
                  <Text style={styles.tagItem}>{item.subTag}</Text>
                </View>
              )}

              {/* JIKA ADA ALASAN PERUBAHAN */}
              {item.reason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>
                    Alasan Perubahan: "{item.reason}"
                  </Text>
                </View>
              )}

              {/* ACTION BUTTON */}
              {item.type === "deadline_h1" && (
                <TouchableOpacity
                  style={styles.openTaskBtn}
                  onPress={() => {
                    if (onOpenTask) onOpenTask();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openTaskBtnText}>Buka Tugas</Text>
                </TouchableOpacity>
              )}

              {item.type === "deadline_changed" && (
                <TouchableOpacity
                  style={styles.scheduleLink}
                  onPress={() => {
                    if (onOpenTask) onOpenTask();
                  }}
                >
                  <Text style={styles.scheduleLinkText}>
                    🔍 Cek Detail Jadwal
                  </Text>
                </TouchableOpacity>
              )}

              {item.sentStatus && (
                <Text style={styles.sentStatusText}>{item.sentStatus}</Text>
              )}
            </View>

            {item.isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      ))}

      {/* FOOTER SYNC */}
      <View style={styles.footerNote}>
        <Text style={styles.footerCheck}>✔</Text>
        <Text style={styles.footerNoteText}>
          Semua notifikasi sinkron dengan database lokal
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineStrip: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineStripText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  alarmBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 14,
  },
  alarmIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alarmTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E40AF",
  },
  alarmSub: {
    fontSize: 10,
    color: "#3B82F6",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
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
  },
  typeLabel: {
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
  sentStatusText: {
    fontSize: 10,
    color: "#15803D",
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 6,
    marginTop: 4,
  },
  footerNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  footerCheck: {
    fontSize: 11,
    color: "#16A34A",
    marginRight: 6,
  },
  footerNoteText: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
