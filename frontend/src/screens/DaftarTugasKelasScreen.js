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
  Clipboard,
} from "react-native";

export default function DaftarTugasKelasScreen({
  kelas,
  currentUser,
  tasks = [],
  onBack,
  onOpenTaskDetail,
  onOpenMembers,
  onAddNewTask,
  onToggleTask,
}) {
  const [selectedMatkul, setSelectedMatkul] = useState("Semua Matkul");

  const isPJMK =
    currentUser?.role?.includes("PJMK") ||
    kelas?.role?.includes("PJMK") ||
    kelas?.dibuat_oleh === currentUser?.userId;

  const currentClass = kelas || {
    name: "Teknik Informatika 2021 - Reguler A",
    code: "TI21-A89K",
    room: "Fakultas Ilmu Komputer • Kelas Utama Angkatan",
    members: 48,
    activeTasks: 3,
  };

  const handleCopyCode = () => {
    const code = currentClass.code || currentClass.kode_kelas || "TI21-A89K";
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(code);
    }
    Alert.alert("Disalin! 📋", `Kode kelas "${code}" telah disalin.`);
  };

  const matkulList = [
    "Semua Matkul",
    "Pemrograman Web",
    "Basis Data",
    "Jaringan Komputer",
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedMatkul === "Semua Matkul") return true;
    return (
      t.subject?.toLowerCase().includes(selectedMatkul.toLowerCase()) ||
      t.title?.toLowerCase().includes(selectedMatkul.toLowerCase())
    );
  });

  const completedCount = filteredTasks.filter((t) => t.status === "Selesai").length;
  const pendingCount = filteredTasks.length - completedCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tasky</Text>
          <Text style={styles.headerSubtitle}>Kelas / Tugas</Text>
        </View>
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
        {/* STRIP MODE OFFLINE */}
        <View style={styles.offlineStrip}>
          <Text style={styles.offlineStripText}>
            ⚠️ Mode Offline • Perubahan akan disinkronkan saat online 🔸
          </Text>
        </View>

        {/* KARTU HEADER KELAS SESUAI IMAGE 3 RIGHT */}
        <View style={styles.classHeaderCard}>
          <View style={styles.classMetaRow}>
            <Text style={styles.semesterTag}>🎓 Semester 7 • 2024/2025</Text>
            {isPJMK ? (
              <View style={styles.pjmkPill}>
                <Text style={styles.pjmkPillText}>👑 Anda PJMK Kelas Ini</Text>
              </View>
            ) : (
              <View style={styles.mhsPill}>
                <Text style={styles.mhsPillText}>👤 Mahasiswa Anggota</Text>
              </View>
            )}
          </View>

          <Text style={styles.classTitle}>{currentClass.name || currentClass.nama_kelas}</Text>
          <Text style={styles.classSubtitle}>{currentClass.room || "Fakultas Ilmu Komputer • Kelas Utama Angkatan"}</Text>

          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.codeChip} onPress={handleCopyCode}>
              <Text style={styles.codeChipText}>
                🔑 {currentClass.code || currentClass.kode_kelas} <Text style={styles.salinLink}>Salin</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.memberChip}
              onPress={onOpenMembers}
              activeOpacity={0.8}
            >
              <Text style={styles.memberChipText}>
                👥 {currentClass.members || 48} Mahasiswa ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() =>
                Alert.alert(
                  currentClass.name || "Detail Kelas",
                  `Kode Undangan: ${currentClass.code || currentClass.kode_kelas}\nTotal Mahasiswa: ${currentClass.members || 48}`
                )
              }
            >
              <Text style={styles.infoBtnText}>ⓘ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BAR URUTAN TUGAS */}
        <View style={styles.sortBar}>
          <View style={styles.sortLeft}>
            <Text style={styles.sortIcon}>⇅</Text>
            <Text style={styles.sortTitle}>URUTAN TUGAS: Deadline Terdekat</Text>
          </View>
          <View style={styles.activeTaskBadge}>
            <Text style={styles.activeTaskText}>
              ⏱️ {filteredTasks.length} Aktif
            </Text>
          </View>
        </View>

        {/* FILTER CHIPS MATA KULIAH */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matkulScroll}
        >
          {matkulList.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.matkulChip,
                selectedMatkul === m && styles.matkulChipActive,
              ]}
              onPress={() => setSelectedMatkul(m)}
            >
              <Text
                style={[
                  styles.matkulChipText,
                  selectedMatkul === m && styles.matkulChipTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION DAFTAR PENUGASAN */}
        <View style={styles.penugasanHeader}>
          <Text style={styles.penugasanTitle}>Daftar Penugasan</Text>
          <Text style={styles.penugasanCounts}>
            {completedCount} Selesai • {pendingCount} Tertunda
          </Text>
        </View>

        {/* LIST KARTU TUGAS */}
        {filteredTasks.map((task) => {
          const isDone = task.status === "Selesai";
          const isWeb = task.subject?.includes("Web");
          const isData = task.subject?.includes("Data");

          return (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => onOpenTaskDetail(task)}
              activeOpacity={0.9}
            >
              {/* TOP ROW: COURSE BADGE & DEADLINE TAG */}
              <View style={styles.taskTopRow}>
                <View
                  style={[
                    styles.courseBadge,
                    isWeb
                      ? styles.badgeWeb
                      : isData
                      ? styles.badgeData
                      : styles.badgeNet,
                  ]}
                >
                  <Text
                    style={[
                      styles.courseBadgeText,
                      isWeb
                        ? styles.textWeb
                        : isData
                        ? styles.textData
                        : styles.textNet,
                    ]}
                  >
                    ● {task.subject}
                  </Text>
                </View>

                <View style={styles.deadlineToRow}>
                  <Text style={styles.deadlineToText}>
                    {task.countdown ? `🔴 ${task.countdown} • ${task.deadline}` : `📅 ${task.deadline}`}
                  </Text>
                </View>
              </View>

              {/* JUDUL TUGAS */}
              <Text
                style={[styles.taskTitle, isDone && styles.taskTitleDone]}
              >
                {task.title}
              </Text>

              {/* DESKRIPSI SNIPPET */}
              <Text style={styles.taskDescSnippet} numberOfLines={2}>
                {task.description ||
                  "Buat endpoint proteksi role-based access control, dokumentasi Swagger, dan sertakan unit test Jest..."}
              </Text>

              {/* PEMBUAT TUGAS */}
              <Text style={styles.taskCreatorText}>
                📝 {task.creator || "Dicatat oleh PJMK (Dimas Pratama)"}
              </Text>

              {/* FOOTER ROW */}
              <View style={styles.taskFooterRow}>
                <Text style={styles.attachmentLink}>
                  📁 {task.attachment || "Unggah di Classroom"}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.statusPillBtn,
                    isDone ? styles.statusPillDone : styles.statusPillPending,
                  ]}
                  onPress={() => onToggleTask(task.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isDone ? styles.textDone : styles.textPending,
                    ]}
                  >
                    {isDone ? "✔ Selesai" : "⭕ Belum Dikerjakan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredTasks.length === 0 && (
          <View style={styles.emptyTasksBox}>
            <Text style={styles.emptyTasksTitle}>Tidak Ada Tugas</Text>
            <Text style={styles.emptyTasksDesc}>
              Belum ada tugas pada kategori ini.
            </Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON: + TUGAS BARU (PJMK) */}
      {isPJMK && (
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={onAddNewTask}
            activeOpacity={0.8}
          >
            <Text style={styles.fabBtnText}>＋ Tugas Baru</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingVertical: 10,
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#073B82",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  offlineStrip: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineStripText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  classHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  classMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  semesterTag: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  pjmkPill: {
    backgroundColor: "#F3E8FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pjmkPillText: {
    fontSize: 10,
    color: "#7E22CE",
    fontWeight: "700",
  },
  mhsPill: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  mhsPillText: {
    fontSize: 10,
    color: "#475467",
    fontWeight: "700",
  },
  classTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#102A36",
    marginBottom: 4,
  },
  classSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeChip: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E40AF",
  },
  salinLink: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  memberChip: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  memberChipText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
  },
  infoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBtnText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "bold",
  },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sortLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortIcon: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 6,
  },
  sortTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#102A36",
    letterSpacing: 0.5,
  },
  activeTaskBadge: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTaskText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "700",
  },
  matkulScroll: {
    gap: 8,
    marginBottom: 14,
  },
  matkulChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  matkulChipActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  matkulChipText: {
    fontSize: 12,
    color: "#475467",
    fontWeight: "600",
  },
  matkulChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  penugasanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  penugasanTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
  },
  penugasanCounts: {
    fontSize: 11,
    color: "#64748B",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courseBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeWeb: {
    backgroundColor: "#DBEAFE",
  },
  badgeData: {
    backgroundColor: "#F3E8FF",
  },
  badgeNet: {
    backgroundColor: "#F1F5F9",
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  textWeb: {
    color: "#1D4ED8",
  },
  textData: {
    color: "#7E22CE",
  },
  textNet: {
    color: "#475467",
  },
  deadlineToRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deadlineToText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 4,
    lineHeight: 20,
  },
  taskTitleDone: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  taskDescSnippet: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 8,
  },
  taskCreatorText: {
    fontSize: 11,
    color: "#94A3B8",
    fontStyle: "italic",
    marginBottom: 10,
  },
  taskFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  attachmentLink: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "500",
  },
  statusPillBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusPillPending: {
    backgroundColor: "#FEE2E2",
  },
  statusPillDone: {
    backgroundColor: "#DCFCE7",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  textPending: {
    color: "#DC2626",
  },
  textDone: {
    color: "#15803D",
  },
  emptyTasksBox: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTasksTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475467",
  },
  emptyTasksDesc: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  fabBtn: {
    backgroundColor: "#073B82",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

