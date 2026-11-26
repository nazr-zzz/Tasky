import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../components/BackButton";
import {
  pick,
  parsePoin,
  getTaskDeadlineDate,
  getDeadlineText,
  formatCountdown,
} from "../utils/deadline";

export default function DetailTugasScreen({
  task,
  currentUser,
  isPjmk, // opsional: kirim dari parent berdasarkan peran di kelas tugas ini
  onBack,
  onToggleStatus,
  onOpenUbahDeadline,
  onOpenEditTask,
  onDeleteTask,
}) {
  const currentTask = task || {};

  const roleText = String(currentUser?.role || "").toLowerCase();
  const isPJMK =
    isPjmk ?? (roleText.includes("pjmk") || roleText.includes("wakil") || Boolean(task?.isPjmk));

  const [personalStatus, setPersonalStatus] = useState(
    currentTask.status === "Selesai" ? "selesai" : "belum"
  );

  // Semua data berasal dari input PJMK saat membuat tugas
  const dosen = pick(currentTask, "dosen", "DOSEN");
  const modul = pick(currentTask, "modul", "MODUL");
  const deskripsi = pick(currentTask, "description", "deskripsi", "DESKRIPSI");
  const poinKunci = parsePoin(
    pick(currentTask, "poinKunci", "poin_kunci", "POIN_KUNCI_LIST", "POIN_KUNCI")
  );
  const link = pick(currentTask, "linkPengumpulan", "link_pengumpulan", "LINK_PENGUMPULAN");
  const pembuat = pick(currentTask, "creator", "NAMA_PEMBUAT");

  const deadlineDate = getTaskDeadlineDate(currentTask);
  const deadlineText = getDeadlineText(currentTask);
  const cd = deadlineDate ? formatCountdown(deadlineDate) : null;

  const handleSelectStatus = (newStatus) => {
    setPersonalStatus(newStatus);
    if (onToggleStatus) {
      onToggleStatus(currentTask.id, newStatus === "selesai" ? "Selesai" : "Belum Dikerjakan");
    }
  };

  const handleOpenLink = async () => {
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert("Gagal", "Tautan tidak dapat dibuka.");
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
          onPress: () => onDeleteTask && onDeleteTask(currentTask.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Detail Tugas" onBack={onBack} initial={currentUser?.nama || "?"} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.badgesBar}>
          <View style={styles.coursePill}>
            <Text style={styles.coursePillText}>💻 {currentTask.subject || "-"}</Text>
          </View>
          {!!modul && (
            <View style={styles.modulePill}>
              <Text style={styles.modulePillText}>{modul}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{currentTask.title}</Text>
        {!!dosen && <Text style={styles.dosenText}>👤 Dosen: {dosen}</Text>}
        {!!pembuat && <Text style={styles.dosenText}>📝 Dicatat oleh {pembuat}</Text>}

        {/* TENGGAT WAKTU (sesuai input) */}
        <View style={styles.dueDateCard}>
          <View style={styles.dueDateTopRow}>
            <Text style={styles.dueIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dueLabel}>TENGGAT WAKTU</Text>
              <Text style={styles.dueValue}>{deadlineText}</Text>
            </View>
          </View>

          {cd && (
            <Text
              style={[
                styles.countdownPill,
                !cd.overdue && { backgroundColor: "#FEF3C7", color: "#B45309" },
              ]}
            >
              {cd.overdue ? "🔴" : "⏳"} {cd.overdue ? cd.text : `Sisa Waktu: ${cd.text}`}
            </Text>
          )}
        </View>

        {/* DESKRIPSI */}
        {(!!deskripsi || poinKunci.length > 0) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>📄</Text>
              <Text style={styles.sectionTitle}>Deskripsi Tugas</Text>
            </View>

            {!!deskripsi && <Text style={styles.descText}>{deskripsi}</Text>}

            {poinKunci.length > 0 && (
              <>
                <Text style={styles.checklistTitle}>Poin Kunci Pengerjaan:</Text>
                {poinKunci.map((p, i) => (
                  <View key={`${p}-${i}`} style={styles.checkItem}>
                    <Text style={styles.checkBullet}>✔</Text>
                    <Text style={styles.checkText}>{p}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* LINK PENGUMPULAN */}
        {!!link && (
          <TouchableOpacity style={styles.linkCard} onPress={handleOpenLink} activeOpacity={0.8}>
            <Text style={styles.linkIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Tautan Pengumpulan</Text>
              <Text style={styles.linkValue} numberOfLines={1}>{link}</Text>
            </View>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* STATUS PRIBADI */}
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
              style={[styles.statusOptionBtn, personalStatus === "belum" && styles.statusOptionActiveRed]}
              onPress={() => handleSelectStatus("belum")}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusOptionText, personalStatus === "belum" && styles.statusTextActiveRed]}>
                ⭕ Belum Selesai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOptionBtn, personalStatus === "selesai" && styles.statusOptionActiveGreen]}
              onPress={() => handleSelectStatus("selesai")}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusOptionText, personalStatus === "selesai" && styles.statusTextActiveGreen]}>
                ✔ Selesai
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.statusHint}>
            ⓘ Perubahan status hanya berpengaruh pada checklist pribadi Anda.
          </Text>
        </View>

        {/* MENU PJMK */}
        {isPJMK && (
          <View style={styles.pjmkMenuCard}>
            <View style={styles.pjmkHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pjmkMenuTitle}>MENU PENGELOLA (PJMK)</Text>
                <Text style={styles.pjmkMenuSub}>
                  Aksi di bawah mempengaruhi jadwal untuk seluruh mahasiswa satu kelas.
                </Text>
              </View>
              <View style={styles.pjmkHakAksesBadge}>
                <Text style={styles.pjmkHakAksesText}>Hak Akses PJMK</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtnBlue} onPress={onOpenUbahDeadline} activeOpacity={0.8}>
              <Text style={styles.actionBtnIcon}>⏰</Text>
              <Text style={styles.actionBtnTextBlue}>Ubah Deadline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnGrey} onPress={onOpenEditTask} activeOpacity={0.8}>
              <Text style={styles.actionBtnIcon}>✏️</Text>
              <Text style={styles.actionBtnTextGrey}>Ubah Tugas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnRed} onPress={handleDelete} activeOpacity={0.8}>
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
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  badgesBar: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  coursePill: { backgroundColor: "#DBEAFE", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  coursePillText: { fontSize: 11, fontWeight: "800", color: "#1E40AF" },
  modulePill: { backgroundColor: "#F1F5F9", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  modulePillText: { fontSize: 11, fontWeight: "600", color: "#475467" },
  title: { fontSize: 20, fontWeight: "900", color: "#102A36", lineHeight: 26, marginBottom: 6 },
  dosenText: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  dueDateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    marginBottom: 16,
  },
  dueDateTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dueIcon: { fontSize: 22, marginRight: 10 },
  dueLabel: { fontSize: 10, fontWeight: "800", color: "#64748B", letterSpacing: 0.8 },
  dueValue: { fontSize: 14, fontWeight: "800", color: "#102A36", marginTop: 2 },
  countdownPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionIcon: { fontSize: 16, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#102A36" },
  descText: { fontSize: 12, color: "#475467", lineHeight: 18, marginBottom: 14 },
  checklistTitle: { fontSize: 12, fontWeight: "800", color: "#102A36", marginBottom: 8 },
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
  checkBullet: { fontSize: 13, color: "#16A34A", fontWeight: "bold", marginRight: 8 },
  checkText: { fontSize: 12, color: "#334155", fontWeight: "500", flex: 1 },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  linkIcon: { fontSize: 18, marginRight: 10 },
  linkTitle: { fontSize: 12, fontWeight: "800", color: "#1E40AF" },
  linkValue: { fontSize: 11, color: "#3B82F6", marginTop: 2 },
  linkArrow: { fontSize: 22, color: "#1E40AF", marginLeft: 8 },
  statusSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  statusHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statusIcon: { fontSize: 16, marginRight: 6 },
  statusTitle: { fontSize: 13, fontWeight: "800", color: "#102A36", flex: 1 },
  pribadiBadge: { backgroundColor: "#F1F5F9", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  pribadiText: { fontSize: 10, color: "#475467", fontWeight: "600" },
  statusToggleGroup: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statusOptionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusOptionActiveRed: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  statusOptionActiveGreen: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  statusOptionText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  statusTextActiveRed: { color: "#DC2626" },
  statusTextActiveGreen: { color: "#15803D" },
  statusHint: { fontSize: 11, color: "#64748B", lineHeight: 16 },
  pjmkMenuCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  pjmkHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  pjmkMenuTitle: { fontSize: 12, fontWeight: "900", color: "#1E40AF", letterSpacing: 0.8, marginBottom: 2 },
  pjmkMenuSub: { fontSize: 11, color: "#3B82F6", lineHeight: 15 },
  pjmkHakAksesBadge: { backgroundColor: "#DBEAFE", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, marginLeft: 8 },
  pjmkHakAksesText: { fontSize: 10, fontWeight: "700", color: "#1D4ED8" },
  actionBtnBlue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    height: 46,
    marginBottom: 8,
  },
  actionBtnIcon: { fontSize: 15, marginRight: 6 },
  actionBtnTextBlue: { fontSize: 13, fontWeight: "700", color: "#1D4ED8" },
  actionBtnGrey: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 8,
  },
  actionBtnTextGrey: { fontSize: 13, fontWeight: "700", color: "#334155" },
  actionBtnRed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    height: 46,
  },
  actionBtnTextRed: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
});