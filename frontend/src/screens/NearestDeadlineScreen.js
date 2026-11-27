import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

function hitungKomponenCountdown(deadlineRaw) {
  if (!deadlineRaw) return null;
  const d = new Date(deadlineRaw);
  if (isNaN(d.getTime())) return null;

  const diff = d.getTime() - Date.now();
  if (diff <= 0) {
    return { overdue: true, hari: 0, jam: 0, menit: 0, detik: 0 };
  }

  const hari = Math.floor(diff / 86400000);
  const jam = Math.floor((diff % 86400000) / 3600000);
  const menit = Math.floor((diff % 3600000) / 60000);
  const detik = Math.floor((diff % 60000) / 1000);

  return { overdue: false, hari, jam, menit, detik };
}

export default function NearestDeadlineModal({
  visible,
  task,
  onClose,
  onOpenTask,
  onToggleTask,
}) {
  const [cd, setCd] = useState(() =>
    task?.deadlineRaw ? hitungKomponenCountdown(task.deadlineRaw) : null
  );

  // Real-time ticking clock setiap 1 detik
  useEffect(() => {
    if (!visible || !task?.deadlineRaw) return;

    setCd(hitungKomponenCountdown(task.deadlineRaw));
    const timer = setInterval(() => {
      setCd(hitungKomponenCountdown(task.deadlineRaw));
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, task?.deadlineRaw]);

  const pad = (n) => String(n || 0).padStart(2, "0");

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
              <Text style={styles.modalTitle}>Deadline Terdekat</Text>
              <Text style={styles.modalSubtitle}>
                Pantau sisa waktu pengerjaan secara real-time
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!task ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                Tidak ada tugas dengan deadline mendekat saat ini.
              </Text>
              <Text style={styles.emptySub}>
                Semua tugas kuliah Anda sudah selesai atau belum ada tugas yang dicatat.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* TICKING COUNTDOWN CLOCK BOX */}
              <View style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerLabel}>HITUNG MUNDUR REAL-TIME</Text>
                  {cd?.overdue ? (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>LEWAT DEADLINE</Text>
                    </View>
                  ) : (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>DETIK AKTIF</Text>
                    </View>
                  )}
                </View>

                {cd?.overdue ? (
                  <View style={styles.overdueAlertBox}>
                    <Text style={styles.overdueAlertTitle}>Waktu Pengumpulan Telah Lewat</Text>
                    <Text style={styles.overdueAlertDesc}>
                      Tenggat waktu tugas ini sudah berakhir. Segera hubungi PJMK atau kumpulkan tugas jika ada dispensasi.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.clockGrid}>
                    <View style={styles.clockCol}>
                      <View style={styles.clockNumBox}>
                        <Text style={styles.clockNum}>{pad(cd?.hari)}</Text>
                      </View>
                      <Text style={styles.clockUnit}>HARI</Text>
                    </View>

                    <Text style={styles.clockColon}>:</Text>

                    <View style={styles.clockCol}>
                      <View style={styles.clockNumBox}>
                        <Text style={styles.clockNum}>{pad(cd?.jam)}</Text>
                      </View>
                      <Text style={styles.clockUnit}>JAM</Text>
                    </View>

                    <Text style={styles.clockColon}>:</Text>

                    <View style={styles.clockCol}>
                      <View style={styles.clockNumBox}>
                        <Text style={styles.clockNum}>{pad(cd?.menit)}</Text>
                      </View>
                      <Text style={styles.clockUnit}>MENIT</Text>
                    </View>

                    <Text style={styles.clockColon}>:</Text>

                    <View style={styles.clockCol}>
                      <View style={[styles.clockNumBox, styles.clockNumBoxSec]}>
                        <Text style={[styles.clockNum, styles.clockNumSec]}>
                          {pad(cd?.detik)}
                        </Text>
                      </View>
                      <Text style={styles.clockUnit}>DETIK</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* DETAIL TUGAS CARD */}
              <View style={styles.taskDetailCard}>
                <View style={styles.subjectRow}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>{task.subject || "Umum"}</Text>
                  </View>
                  <Text style={styles.dosenText}>{task.dosen || "Dosen Pengampu"}</Text>
                </View>

                <Text style={styles.taskTitle}>{task.title}</Text>

                <View style={styles.deadlineInfoRow}>
                  <Text style={styles.deadlineLabel}>Batas Akhir Pengumpulan:</Text>
                  <Text style={styles.deadlineVal}>{task.deadline}</Text>
                </View>

                {task.description ? (
                  <View style={styles.descBox}>
                    <Text style={styles.descTitle}>Petunjuk Pengerjaan:</Text>
                    <Text style={styles.descText} numberOfLines={4}>
                      {task.description}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => {
                    onToggleTask(task.id, "selesai");
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeBtnText}>Tandai Selesai</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.openDetailBtn}
                  onPress={() => {
                    onClose();
                    onOpenTask(task);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openDetailBtnText}>Buka Detail Tugas</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
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
  emptyBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  timerCard: {
    backgroundColor: "#0B2A4A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#93C5FD",
    letterSpacing: 1.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.4)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38BDF8",
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  overdueBadge: {
    backgroundColor: "#DC2626",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  overdueAlertBox: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  overdueAlertTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FCA5A5",
    marginBottom: 4,
  },
  overdueAlertDesc: {
    fontSize: 11,
    color: "#FEE2E2",
    lineHeight: 16,
  },
  clockGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clockCol: {
    alignItems: "center",
    flex: 1,
  },
  clockNumBox: {
    backgroundColor: "#1E3A8A",
    width: "90%",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3B82F6",
    marginBottom: 6,
  },
  clockNumBoxSec: {
    backgroundColor: "#1E40AF",
    borderColor: "#60A5FA",
  },
  clockNum: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  clockNumSec: {
    color: "#93C5FD",
  },
  clockColon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#60A5FA",
    marginBottom: 20,
  },
  clockUnit: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  taskDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  subjectRow: {
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
  dosenText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  deadlineInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  deadlineLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  deadlineVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  descBox: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  descTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 2,
  },
  descText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: "#DCFCE7",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#15803D",
  },
  openDetailBtn: {
    flex: 1.2,
    backgroundColor: "#0047BA",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  openDetailBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
