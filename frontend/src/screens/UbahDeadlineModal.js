import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { updateTask } from "../services/api";

export default function UbahDeadlineModal({
  visible,
  task,
  currentUser,
  onClose,
  onDeadlineUpdated,
}) {
  const currentTask = task || {
    id: "t_pwl_jwt",
    subject: "Pemrograman Web Lanjut",
    title: "RESTful API & Autentikasi JWT",
    deadline: "15 Nov 2024, 23:59 WIB",
  };

  const [tanggalBaru, setTanggalBaru] = useState("20 November 2024");
  const [jamBaru, setJamBaru] = useState("23:59 WIB");
  const [alasan, setAlasan] = useState(
    "Dosen pengampu memberikan dispensasi penyesuaian materi koneksi"
  );
  const [loading, setLoading] = useState(false);

  const handleQuickExtend = () => {
    setTanggalBaru("20 November 2024");
    Alert.alert("Perpanjangan Cepat", "Tenggat waktu diperpanjang +5 hari.");
  };

  const handleSimpan = async () => {
    setLoading(true);
    const deadlineString = `${tanggalBaru}, ${jamBaru}`;

    try {
      if (currentTask.id) {
        await updateTask(currentTask.id, {
          judul_tugas: currentTask.title,
          mata_kuliah: currentTask.subject,
          deadline: deadlineString,
          deskripsi: currentTask.description,
          diubah_oleh: currentUser?.userId || "u_pjmk_dimas",
        });
      }

      Alert.alert(
        "Deadline Berhasil Diperbarui! ⏰",
        `Batas waktu tugas diubah menjadi ${deadlineString}.\nNotifikasi telah dikirimkan ke seluruh anggota kelas.`
      );

      if (onDeadlineUpdated) {
        onDeadlineUpdated(currentTask.id, deadlineString, alasan);
      }
      onClose();
    } catch (e) {
      // Fallback offline
      Alert.alert(
        "Diperbarui Secara Lokal",
        `Deadline tugas telah diubah menjadi ${deadlineString}.`
      );
      if (onDeadlineUpdated) {
        onDeadlineUpdated(currentTask.id, deadlineString, alasan);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetCard}>
          {/* HEADER */}
          <View style={styles.sheetHeader}>
            <View style={styles.pjmkTag}>
              <Text style={styles.pjmkTagText}>★ HAK AKSES PJMK</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetTitle}>Perbarui Deadline Tugas</Text>
          <Text style={styles.taskTargetText}>
            {currentTask.subject} • {currentTask.title}
          </Text>

          {/* NOTICE BLUE BOX */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ⓘ Perubahan deadline ini akan otomatis mengirimkan notifikasi dan
              memperbarui jadwal seluruh anggota kelas.
            </Text>
          </View>

          {/* DEADLINE SAAT INI */}
          <View style={styles.currentDueBox}>
            <Text style={styles.currentDueLabel}>⏱️ Deadline Saat Ini:</Text>
            <Text style={styles.currentDueValue}>{currentTask.deadline}</Text>
          </View>

          {/* TANGGAL BARU */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Tanggal Pengumpulan Baru</Text>
            <TouchableOpacity onPress={handleQuickExtend}>
              <Text style={styles.quickExtendLink}>+5 Hari Perpanjangan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>📅</Text>
            <TextInput
              style={styles.textInput}
              value={tanggalBaru}
              onChangeText={setTanggalBaru}
            />
          </View>

          {/* JAM BARU */}
          <Text style={styles.fieldLabel}>Batas Waktu Pengumpulan (Jam)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>🕒</Text>
            <TextInput
              style={styles.textInput}
              value={jamBaru}
              onChangeText={setJamBaru}
            />
            <Text style={styles.wibTag}>WIB</Text>
          </View>

          {/* ALASAN PERUBAHAN */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Alasan Perubahan</Text>
            <Text style={styles.optionalTag}>Opsional</Text>
          </View>
          <View style={[styles.inputBox, styles.inputBoxArea]}>
            <TextInput
              style={[styles.textInput, styles.areaInput]}
              value={alasan}
              onChangeText={setAlasan}
              placeholder="Contoh: Dosen pengampu memberikan perpanjangan waktu..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          {/* NOTIFIKASI PREVIEW */}
          <View style={styles.notifPreviewBox}>
            <Text style={styles.notifPreviewIcon}>📣</Text>
            <Text style={styles.notifPreviewText}>
              Notifikasi{" "}
              <Text style={styles.boldText}>"Perubahan Deadline dari PJMK"</Text>{" "}
              akan dikirim ke 48 mahasiswa.
            </Text>
          </View>

          {/* TOMBOL BATAL & SIMPAN */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.btnDisabled]}
              onPress={handleSimpan}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>▶ Simpan & Perbarui</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 25, 47, 0.65)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pjmkTag: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pjmkTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#102A36",
    marginBottom: 2,
  },
  taskTargetText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  noticeBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    color: "#1D4ED8",
    lineHeight: 16,
  },
  currentDueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  currentDueLabel: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
  },
  currentDueValue: {
    fontSize: 11,
    color: "#102A36",
    fontWeight: "800",
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
  },
  quickExtendLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  optionalTag: {
    fontSize: 10,
    color: "#94A3B8",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  inputBoxArea: {
    height: 60,
    paddingVertical: 6,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: "#102A36",
  },
  areaInput: {
    height: "100%",
    textAlignVertical: "top",
  },
  wibTag: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  notifPreviewBox: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    marginBottom: 16,
  },
  notifPreviewIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  notifPreviewText: {
    fontSize: 11,
    color: "#166534",
    flex: 1,
  },
  boldText: {
    fontWeight: "700",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475467",
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#073B82",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

