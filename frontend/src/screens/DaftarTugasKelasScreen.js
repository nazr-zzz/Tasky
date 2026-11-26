import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import ScreenHeader from "../components/BackButton";
import { pick, getTaskDeadlineDate, getDeadlineText, formatCountdown } from "../utils/deadline";

// Warna badge mata kuliah dibuat dinamis dari nama matkul
const PALETTE = [
  { bg: "#DBEAFE", fg: "#1D4ED8" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
  { bg: "#DCFCE7", fg: "#15803D" },
  { bg: "#FFEDD5", fg: "#C2410C" },
  { bg: "#F1F5F9", fg: "#475467" },
];
const warnaMatkul = (name) => {
  const s = String(name || "");
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
};

export default function DaftarTugasKelasScreen({
  kelas,
  currentUser,
  tasks = [],
  isPjmk, // opsional: kirim dari parent berdasarkan peran di kelas ini
  onBack,
  onOpenTaskDetail,
  onOpenMembers,
  onAddNewTask,
  onToggleTask,
}) {
  const [selectedMatkul, setSelectedMatkul] = useState("Semua Matkul");

  const isPJMK =
    isPjmk ??
    (String(kelas?.role || "").toLowerCase().includes("pjmk") ||
      String(kelas?.role || "").toLowerCase().includes("wakil") ||
      Boolean(kelas?.isPjmk));

  const currentClass = kelas || {};
  const namaKelas = currentClass.name || currentClass.nama_kelas || "Kelas";
  const kodeKelas = currentClass.code || currentClass.kode_kelas || "-";
  const jumlahAnggota = currentClass.members ?? currentClass.jumlah_anggota ?? 0;

  // Semester dari data yang diisi saat membuat kelas (bukan teks tetap)
  const semesterRaw = pick(currentClass, "semester", "SEMESTER");
  const tahunAjaran = pick(currentClass, "tahunAjaran", "tahun_ajaran", "TAHUN_AJARAN");
  const semesterText = [
    semesterRaw !== undefined
      ? /semester/i.test(String(semesterRaw))
        ? String(semesterRaw)
        : `Semester ${semesterRaw}`
      : null,
    tahunAjaran,
  ]
    .filter(Boolean)
    .join(" • ");
  const subtitleKelas = pick(currentClass, "room", "deskripsi", "DESKRIPSI");

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(kodeKelas);
      Alert.alert("Disalin! 📋", `Kode kelas "${kodeKelas}" telah disalin.`);
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyalin kode.");
    }
  };

  const uniqueSubjects = Array.from(new Set(tasks.map((t) => t.subject).filter(Boolean)));
  const matkulList = ["Semua Matkul", ...uniqueSubjects];

  const filteredTasks = tasks.filter(
    (t) => selectedMatkul === "Semua Matkul" || t.subject === selectedMatkul
  );

  const completedCount = filteredTasks.filter((t) => t.status === "Selesai").length;
  const pendingCount = filteredTasks.length - completedCount;

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScreenHeader
        title="Tasky"
        subtitle="Kelas / Tugas"
        onBack={onBack}
        initial={currentUser?.nama || "?"}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* KARTU HEADER KELAS */}
        <View style={styles.classHeaderCard}>
          <View style={styles.classMetaRow}>
            {semesterText ? (
              <Text style={styles.semesterTag}>🎓 {semesterText}</Text>
            ) : (
              <View />
            )}
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

          <Text style={styles.classTitle}>{namaKelas}</Text>
          {!!subtitleKelas && <Text style={styles.classSubtitle}>{subtitleKelas}</Text>}

          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.codeChip} onPress={handleCopyCode}>
              <Text style={styles.codeChipText}>
                🔑 {kodeKelas} <Text style={styles.salinLink}>Salin</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.memberChip} onPress={onOpenMembers} activeOpacity={0.8}>
              <Text style={styles.memberChipText}>👥 {jumlahAnggota} Mahasiswa ›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() =>
                Alert.alert(
                  namaKelas,
                  `Kode Undangan: ${kodeKelas}\nTotal Mahasiswa: ${jumlahAnggota}${
                    semesterText ? `\n${semesterText}` : ""
                  }`
                )
              }
            >
              <Text style={styles.infoBtnText}>ⓘ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BAR URUTAN */}
        <View style={styles.sortBar}>
          <View style={styles.sortLeft}>
            <Text style={styles.sortIcon}>⇅</Text>
            <Text style={styles.sortTitle}>URUTAN TUGAS: Deadline Terdekat</Text>
          </View>
          <View style={styles.activeTaskBadge}>
            <Text style={styles.activeTaskText}>⏱️ {filteredTasks.length} Tugas</Text>
          </View>
        </View>

        {/* FILTER MATKUL */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matkulScroll}
        >
          {matkulList.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.matkulChip, selectedMatkul === m && styles.matkulChipActive]}
              onPress={() => setSelectedMatkul(m)}
            >
              <Text
                style={[styles.matkulChipText, selectedMatkul === m && styles.matkulChipTextActive]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.penugasanHeader}>
          <Text style={styles.penugasanTitle}>Daftar Penugasan</Text>
          <Text style={styles.penugasanCounts}>
            {completedCount} Selesai • {pendingCount} Tertunda
          </Text>
        </View>

        {/* LIST TUGAS */}
        {filteredTasks.map((task) => {
          const isDone = task.status === "Selesai";
          const warna = warnaMatkul(task.subject);
          const deadlineDate = getTaskDeadlineDate(task);
          const cd = deadlineDate ? formatCountdown(deadlineDate) : null;
          const deadlineText = getDeadlineText(task);
          const deskripsi = pick(task, "description", "deskripsi", "DESKRIPSI");
          const pembuat = pick(task, "creator", "NAMA_PEMBUAT");
          const link = pick(task, "linkPengumpulan", "link_pengumpulan", "LINK_PENGUMPULAN");

          return (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => onOpenTaskDetail(task)}
              activeOpacity={0.9}
            >
              <View style={styles.taskTopRow}>
                <View style={[styles.courseBadge, { backgroundColor: warna.bg }]}>
                  <Text style={[styles.courseBadgeText, { color: warna.fg }]} numberOfLines={1}>
                    ● {task.subject}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.deadlineToText,
                    isDone && { color: "#94A3B8" },
                    !isDone && cd && !cd.overdue && { color: "#B45309" },
                  ]}
                  numberOfLines={1}
                >
                  {cd && !isDone ? `${cd.overdue ? "🔴" : "⏳"} ${cd.text}` : `📅 ${deadlineText}`}
                </Text>
              </View>

              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>

              {!!deskripsi && (
                <Text style={styles.taskDescSnippet} numberOfLines={2}>
                  {deskripsi}
                </Text>
              )}

              <Text style={styles.taskDeadlineLine}>📅 {deadlineText}</Text>
              {!!pembuat && <Text style={styles.taskCreatorText}>📝 Dicatat oleh {pembuat}</Text>}

              <View style={styles.taskFooterRow}>
                <Text style={styles.attachmentLink} numberOfLines={1}>
                  {link ? "🔗 Ada tautan pengumpulan" : "📁 Lihat detail"}
                </Text>

                <TouchableOpacity
                  style={[styles.statusPillBtn, isDone ? styles.statusPillDone : styles.statusPillPending]}
                  onPress={() => onToggleTask(task.id)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.statusPillText, isDone ? styles.textDone : styles.textPending]}>
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
            <Text style={styles.emptyTasksDesc}>Belum ada tugas pada kategori ini.</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {isPJMK && (
        <View style={styles.fabWrapper}>
          <TouchableOpacity style={styles.fabBtn} onPress={onAddNewTask} activeOpacity={0.8}>
            <Text style={styles.fabBtnText}>＋ Tugas Baru</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { paddingHorizontal: 16, paddingTop: 14 },
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
  semesterTag: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  pjmkPill: { backgroundColor: "#F3E8FF", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  pjmkPillText: { fontSize: 10, color: "#7E22CE", fontWeight: "700" },
  mhsPill: { backgroundColor: "#F1F5F9", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  mhsPillText: { fontSize: 10, color: "#475467", fontWeight: "700" },
  classTitle: { fontSize: 17, fontWeight: "900", color: "#102A36", marginBottom: 4 },
  classSubtitle: { fontSize: 12, color: "#64748B", marginBottom: 4 },
  chipsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  codeChip: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  codeChipText: { fontSize: 11, fontWeight: "700", color: "#1E40AF" },
  salinLink: { color: "#2563EB", textDecorationLine: "underline" },
  memberChip: { backgroundColor: "#F1F5F9", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10 },
  memberChipText: { fontSize: 11, color: "#475467", fontWeight: "600" },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBtnText: { fontSize: 13, color: "#64748B", fontWeight: "bold" },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sortLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  sortIcon: { fontSize: 14, color: "#64748B", marginRight: 6 },
  sortTitle: { fontSize: 11, fontWeight: "800", color: "#102A36", letterSpacing: 0.5 },
  activeTaskBadge: { backgroundColor: "#EFF6FF", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  activeTaskText: { fontSize: 11, color: "#1D4ED8", fontWeight: "700" },
  matkulScroll: { gap: 8, marginBottom: 14 },
  matkulChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  matkulChipActive: { backgroundColor: "#073B82", borderColor: "#073B82" },
  matkulChipText: { fontSize: 12, color: "#475467", fontWeight: "600" },
  matkulChipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  penugasanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  penugasanTitle: { fontSize: 14, fontWeight: "800", color: "#102A36" },
  penugasanCounts: { fontSize: 11, color: "#64748B" },
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
    gap: 8,
  },
  courseBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, flexShrink: 1 },
  courseBadgeText: { fontSize: 10, fontWeight: "700" },
  deadlineToText: { fontSize: 10, color: "#DC2626", fontWeight: "700", flexShrink: 1 },
  taskTitle: { fontSize: 14, fontWeight: "800", color: "#102A36", marginBottom: 4, lineHeight: 20 },
  taskTitleDone: { color: "#94A3B8", textDecorationLine: "line-through" },
  taskDescSnippet: { fontSize: 11, color: "#64748B", lineHeight: 16, marginBottom: 6 },
  taskDeadlineLine: { fontSize: 11, color: "#475467", marginBottom: 4 },
  taskCreatorText: { fontSize: 11, color: "#94A3B8", fontStyle: "italic", marginBottom: 6 },
  taskFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    marginTop: 4,
  },
  attachmentLink: { fontSize: 11, color: "#475467", fontWeight: "500", flexShrink: 1, marginRight: 8 },
  statusPillBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  statusPillPending: { backgroundColor: "#FEE2E2" },
  statusPillDone: { backgroundColor: "#DCFCE7" },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  textPending: { color: "#DC2626" },
  textDone: { color: "#15803D" },
  emptyTasksBox: { alignItems: "center", paddingVertical: 30 },
  emptyTasksTitle: { fontSize: 14, fontWeight: "700", color: "#475467" },
  emptyTasksDesc: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  fabWrapper: { position: "absolute", bottom: 20, right: 20 },
  fabBtn: {
    backgroundColor: "#073B82",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 26,
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});