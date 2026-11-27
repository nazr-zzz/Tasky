import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function PendingTasksModal({
  visible,
  tasks = [],
  onClose,
  onOpenTask,
  onToggleTask,
}) {
  const [filter, setFilter] = useState("semua"); // "semua" | "urgent"

  const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = a.deadlineRaw ? new Date(a.deadlineRaw).getTime() : Infinity;
    const timeB = b.deadlineRaw ? new Date(b.deadlineRaw).getTime() : Infinity;
    return timeA - timeB;
  });

  const urgentTasks = sortedTasks.filter((t) => {
    if (!t.deadlineRaw) return false;
    const diff = new Date(t.deadlineRaw).getTime() - Date.now();
    return diff > 0 && diff <= 86400000 * 2; // H-2 atau kurang
  });

  const displayedTasks = filter === "urgent" ? urgentTasks : sortedTasks;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Tugas Belum Selesai</Text>
              <Text style={styles.modalSubtitle}>
                {tasks.length} tugas masih dalam daftar pengerjaan
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* TIPS PENYELESAIAN & MANAJEMEN WAKTU */}
            <View style={styles.solutionBox}>
              <View style={styles.solutionHeader}>
                <View style={styles.solutionPill}>
                  <Text style={styles.solutionPillText}>SOLUSI PENYELESAIAN</Text>
                </View>
              </View>
              <Text style={styles.solutionTitle}>Metode Belajar Efektif (Teknik Pomodoro)</Text>
              <Text style={styles.solutionDesc}>
                Fokus kerjakan satu tugas selama 25 menit penuh tanpa distraksi, lalu istirahat 5 menit. Selesaikan tugas dengan tenggat terdekat terlebih dahulu.
              </Text>

              <View style={styles.tipsRow}>
                <View style={styles.tipCard}>
                  <Text style={styles.tipNum}>01</Text>
                  <Text style={styles.tipText}>Prioritas H-1 & H-3</Text>
                </View>
                <View style={styles.tipCard}>
                  <Text style={styles.tipNum}>02</Text>
                  <Text style={styles.tipText}>Pecah Jadi Checklist</Text>
                </View>
                <View style={styles.tipCard}>
                  <Text style={styles.tipNum}>03</Text>
                  <Text style={styles.tipText}>Tandai Selesai Langsung</Text>
                </View>
              </View>
            </View>

            {/* FILTER TAB */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filter === "semua" && styles.filterChipActive]}
                onPress={() => setFilter("semua")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "semua" && styles.filterChipTextActive,
                  ]}
                >
                  Semua Belum Selesai ({sortedTasks.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filter === "urgent" && styles.filterChipActive]}
                onPress={() => setFilter("urgent")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === "urgent" && styles.filterChipTextActive,
                  ]}
                >
                  Mendesak / H-2 ({urgentTasks.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* DAFTAR TUGAS */}
            {displayedTasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>
                  {filter === "urgent"
                    ? "Tidak ada tugas mendesak saat ini."
                    : "Luar biasa! Seluruh tugas kuliah telah Anda selesaikan."}
                </Text>
              </View>
            ) : (
              displayedTasks.map((t) => (
                <View key={t.id} style={styles.taskCard}>
                  <View style={styles.taskCardTop}>
                    <View style={styles.subjectPill}>
                      <Text style={styles.subjectPillText}>{t.subject || "Umum"}</Text>
                    </View>
                    {t.countdown ? (
                      <View style={styles.countdownBadge}>
                        <Text style={styles.countdownText}>{t.countdown}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <Text style={styles.taskDeadline}>Deadline: {t.deadline}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => onToggleTask(t.id, "selesai")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.completeBtnText}>Tandai Selesai</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => {
                        onClose();
                        onOpenTask(t);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailBtnText}>Lihat Detail</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },
  solutionBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  solutionHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  solutionPill: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  solutionPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.6,
  },
  solutionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 4,
  },
  solutionDesc: {
    fontSize: 12,
    color: "#3B82F6",
    lineHeight: 17,
    marginBottom: 10,
  },
  tipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  tipNum: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
    marginBottom: 2,
  },
  tipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#1D4ED8",
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  taskCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  taskCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectPill: {
    backgroundColor: "#EEF4FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  countdownBadge: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  taskDeadline: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: "#DCFCE7",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },
  detailBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
});
