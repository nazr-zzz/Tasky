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

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const KUNCI_BULAN = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6,
  agu: 7, agt: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

// Hitung tanggal baru (+N hari) dari teks deadline seperti "16 Nov 2024, 23:59 WIB"
function tambahHari(deadline, hari) {
  const s = String(deadline || "");
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const bulan = KUNCI_BULAN[m[2].slice(0, 3).toLowerCase()];
  if (bulan === undefined) return null;
  const d = new Date(Number(m[3]), bulan, Number(m[1]));
  d.setDate(d.getDate() + hari);
  const jam = s.match(/(\d{1,2}:\d{2})/);
  return {
    tanggal: `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`,
    jam: jam ? `${jam[1]} WIB` : "",
  };
}

export default function UbahDeadlineModal({
  visible,
  task,
  currentUser,
  onClose,
  onDeadlineUpdated,
}) {
  const currentTask = task || { subject: "-", title: "-", deadline: "-" };

  const [tanggalBaru, setTanggalBaru] = useState("");
  const [jamBaru, setJamBaru] = useState("");
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickExtend = () => {
    const hasil = tambahHari(currentTask.deadline, 5);
    if (!hasil) {
      Alert.alert(
        "Tidak Dapat Menghitung",
        "Format deadline saat ini tidak dikenali. Isi tanggal baru secara manual."
      );
      return;
    }
    setTanggalBaru(hasil.tanggal);
    if (hasil.jam) setJamBaru(hasil.jam);
  };

  const handleSimpan = async () => {
    if (!tanggalBaru.trim() || !jamBaru.trim()) {
      Alert.alert("Perhatian", "Tanggal dan jam deadline baru wajib diisi.");
      return;
    }
    if (!currentTask.id || !currentUser?.userId) {
      Alert.alert("Gagal", "Data tugas atau sesi login tidak ditemukan.");
      return;
    }

    const jam = jamBaru.trim();
    const deadlineString = `${tanggalBaru.trim()}, ${/wib/i.test(jam) ? jam : `${jam} WIB`}`;

    setLoading(true);
    try {
      await updateTask(currentTask.id, {
        kelas_id: currentTask.kelas_id,
        judul_tugas: currentTask.title,
        mata_kuliah: currentTask.subject,
        deadline: deadlineString,
        deskripsi: currentTask.description,
        diubah_oleh: currentUser.userId,
        alasan: alasan.trim(),
      });

      Alert.alert(
        "Deadline Berhasil Diperbarui! ⏰",
        `Batas waktu tugas diubah menjadi ${deadlineString}.`
      );

      // Dashboard mengambil ulang data terbaru dari server
      if (onDeadlineUpdated) await onDeadlineUpdated(currentTask.id, deadlineString, alasan.trim());
      onClose();
    } catch (e) {
      Alert.alert("Gagal Memperbarui Deadline", e?.message || "Tidak dapat terhubung ke server.");
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
              placeholder="Contoh: 20 Nov 2024"
              placeholderTextColor="#94A3B8"
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
              placeholder="Contoh: 23:59"
              placeholderTextColor="#94A3B8"
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
              akan dikirim ke seluruh anggota kelas.
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