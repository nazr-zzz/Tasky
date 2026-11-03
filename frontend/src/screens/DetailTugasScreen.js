import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";

export default function DetailTugasScreen({
  task,
  currentUser,
  onBack,
  onToggleStatus,
  onOpenUbahDeadline,
  onOpenEditTask,
  onDeleteTask,
}) {
  const currentTask = task || {
    id: "t_pwl_jwt",
    subject: "Pemrograman Web Lanjut",
    title: "Implementasi RESTful API & Autentikasi JWT",
    deadline: "Kamis, 15 Nov 2024 • 23:59 WIB",
    countdown: "1 Hari 4 Jam",
    dosen: "Dr. Aris Munandar, M.Kom",
    description:
      "Buatlah endpoint autentikasi menggunakan format JSON Web Token (JWT) dengan refresh token. Pastikan skema database menyertakan tabel user, role, dan token whitelist. Struktur folder mengikuti MVC arsitektur bersih.",
    status: "Belum Dikerjakan",
  };

  const isPJMK =
    currentUser?.role?.includes("PJMK") ||
    currentUser?.email?.includes("pjmk") ||
    currentUser?.nama?.includes("Dimas");

  const [personalStatus, setPersonalStatus] = useState(
    currentTask.status === "Selesai" ? "selesai" : "belum"
  );

  const handleSelectStatus = (newStatus) => {
    setPersonalStatus(newStatus);
    if (onToggleStatus) {
      onToggleStatus(currentTask.id, newStatus === "selesai" ? "Selesai" : "Belum Dikerjakan");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Hapus Tugas Kelas",
      "Apakah Anda yakin ingin menghapus tugas ini? Tugas akan terhapus dari seluruh jadwal mahasiswa anggota kelas.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            if (onDeleteTask) onDeleteTask(currentTask.id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tugas</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "D").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* BADGES BAR */}
        <View style={styles.badgesBar}>
          <View style={styles.coursePill}>
            <Text style={styles.coursePillText}>
              💻 {currentTask.subject || "PEMROGRAMAN WEB LANJUT"}
            </Text>
          </View>
          <View style={styles.modulePill}>
            <Text style={styles.modulePillText}>Modul 4</Text>
          </View>
        </View>

        {/* JUDUL TUGAS & DOSEN */}
        <Text style={styles.title}>{currentTask.title}</Text>
        <Text style={styles.dosenText}>
          👤 Dosen: {currentTask.dosen || "Dr. Aris Munandar, M.Kom"}
        </Text>

        {/* DUE DATE CARD */}
        <View style={styles.dueDateCard}>
          <View style={styles.dueDateTopRow}>
            <Text style={styles.dueIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dueLabel}>TENGGAT WAKTU</Text>
              <Text style={styles.dueValue}>{currentTask.deadline}</Text>
            </View>
          </View>

          <View style={styles.countdownRow}>
            <Text style={styles.countdownPill}>
              🔴 Sisa Waktu: {currentTask.countdown || "1 Hari 4 Jam"}
            </Text>
          </View>

          <View style={styles.dueFooterRow}>
            <Text style={styles.syncStatusText}>
              ☁️ Sinkronisasi Lokal Aktif
            </Text>
            <Text style={styles.dbLocationText}>Tersimpan di Room DB</Text>
          </View>
        </View>

        {/* DESKRIPSI TUGAS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>📄</Text>
            <Text style={styles.sectionTitle}>Deskripsi Tugas</Text>
          </View>

          <Text style={styles.descText}>{currentTask.description}</Text>

          <Text style={styles.checklistTitle}>Poin Kunci Pengerjaan:</Text>
          <View style={styles.checkItem}>
            <Text style={styles.checkBullet}>✔</Text>
            <Text style={styles.checkText}>Token Whitelist & Blacklist mekanik</Text>
          </View>
          <View style={styles.checkItem}>
            <Text style={styles.checkBullet}>✔</Text>
            <Text style={styles.checkText}>Middleware proteksi endpoint privat</Text>
          </View>
          <View style={styles.checkItem}>
            <Text style={styles.checkBullet}>✔</Text>
            <Text style={styles.checkText}>Format respon JSON terstandardisasi</Text>
          </View>
        </View>

        {/* STATUS PENGERJAAN ANDA (PRIBADI SESUAI SRS US-05) */}
        <View style={styles.statusSectionCard}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusIcon}>✨</Text>
            <Text style={styles.statusTitle}>Status Pengerjaan Anda</Text>
            <View style={styles.pribadiBadge}>
              <Text style={styles.pribadiText}>Pribadi</Text>
            </View>
          </View>

          <View style={styles.statusToggleGroup}>
            <TouchableOpacity
              style={[
                styles.statusOptionBtn,
                personalStatus === "belum" && styles.statusOptionActiveRed,
              ]}
              onPress={() => handleSelectStatus("belum")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusOptionText,
                  personalStatus === "belum" && styles.statusTextActiveRed,
                ]}
              >
                ⭕ Belum Selesai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOptionBtn,
                personalStatus === "selesai" && styles.statusOptionActiveGreen,
              ]}
              onPress={() => handleSelectStatus("selesai")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusOptionText,
                  personalStatus === "selesai" && styles.statusTextActiveGreen,
                ]}
              >
                ✔ Selesai ✓
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.statusHint}>
            ⓘ Perubahan status hanya berpengaruh pada checklist pribadi Anda dan
            tersimpan secara offline.
          </Text>
        </View>

        {/* MENU PENGELOLA (PJMK) - HANYA TAMPIL UNTUK PJMK */}
        {isPJMK && (
          <View style={styles.pjmkMenuCard}>
            <View style={styles.pjmkHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pjmkMenuTitle}>MENU PENGELOLA (PJMK)</Text>
                <Text style={styles.pjmkMenuSub}>
                  Aksi di bawah mempengaruhi jadwal dan modul untuk seluruh
                  mahasiswa satu kelas.
                </Text>
              </View>
              <View style={styles.pjmkHakAksesBadge}>
                <Text style={styles.pjmkHakAksesText}>Hak Akses PJMK</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtnBlue}
              onPress={onOpenUbahDeadline}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnIcon}>⏰</Text>
              <Text style={styles.actionBtnTextBlue}>Ubah Deadline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnGrey}
              onPress={onOpenEditTask}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnIcon}>✏️</Text>
              <Text style={styles.actionBtnTextGrey}>Ubah Tugas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnRed}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnIcon}>🗑️</Text>
              <Text style={styles.actionBtnTextRed}>Hapus Tugas</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    color: "#102A36",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#102A36",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0EDFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE0FD",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#073B82",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  badgesBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  coursePill: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  coursePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E40AF",
  },
  modulePill: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modulePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475467",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#102A36",
    lineHeight: 26,
    marginBottom: 6,
  },
  dosenText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
  },
  dueDateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  dueDateTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dueIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  dueLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  dueValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
    marginTop: 2,
  },
  countdownRow: {
    marginBottom: 10,
  },
  countdownPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dueFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  syncStatusText: {
    fontSize: 11,
    color: "#1D4ED8",
  },
  dbLocationText: {
    fontSize: 11,
    color: "#64748B",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
  },
  descText: {
    fontSize: 12,
    color: "#475467",
    lineHeight: 18,
    marginBottom: 14,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkBullet: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "bold",
    marginRight: 8,
  },
  checkText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
  },
  statusSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
    flex: 1,
  },
  pribadiBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pribadiText: {
    fontSize: 10,
    color: "#475467",
    fontWeight: "600",
  },
  statusToggleGroup: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statusOptionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusOptionActiveRed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  statusOptionActiveGreen: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  statusTextActiveRed: {
    color: "#DC2626",
  },
  statusTextActiveGreen: {
    color: "#15803D",
  },
  statusHint: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  pjmkMenuCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  pjmkHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pjmkMenuTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1E40AF",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  pjmkMenuSub: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 15,
  },
  pjmkHakAksesBadge: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  pjmkHakAksesText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  actionBtnBlue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    height: 44,
    marginBottom: 8,
  },
  actionBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  actionBtnTextBlue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  actionBtnGrey: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 8,
  },
  actionBtnTextGrey: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  actionBtnRed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    height: 44,
  },
  actionBtnTextRed: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
});

