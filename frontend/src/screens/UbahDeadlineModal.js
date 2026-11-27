import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { updateTask } from "../services/api";
import { getTaskDeadlineDate, formatTanggal, formatJam } from "../utils/deadline";

export default function UbahDeadlineModal({
  visible,
  task,
  currentUser,
  onClose,
  onDeadlineUpdated,
}) {
  const currentTask = task || { subject: "-", title: "-", deadline: "-" };

  const deadlineAwal = getTaskDeadlineDate(task) || new Date();
  const [deadline, setDeadline] = useState(deadlineAwal);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && task) {
      setDeadline(getTaskDeadlineDate(task) || new Date());
      setAlasan("");
    }
  }, [visible, task]);

  const applyPicked = (mode, picked) => {
    setDeadline((prev) => {
      const n = new Date(prev);
      if (mode === "date") n.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      else n.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return n;
    });
  };

  const openAndroidPicker = (mode) => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode,
      is24Hour: true,
      onChange: (event, picked) => {
        if (event.type === "set" && picked) applyPicked(mode, picked);
      },
    });
  };

  const handleQuickExtend = () => {
    setDeadline((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + 5);
      return n;
    });
  };

  const handleSimpan = async () => {
    if (!currentTask.id || !currentUser?.userId) {
      Alert.alert("Gagal", "Data tugas atau sesi login tidak ditemukan.");
      return;
    }

    setLoading(true);
    try {
      const isoString = deadline.toISOString();

      await updateTask(currentTask.id, {
        kelas_id: currentTask.kelas_id,
        judul_tugas: currentTask.title,
        mata_kuliah: currentTask.subject,
        deadline: isoString,
        deskripsi: currentTask.description,
        diubah_oleh: currentUser.userId,
        alasan: alasan.trim(),
      });

      Alert.alert(
        "Deadline Berhasil Diperbarui",
        `Batas waktu tugas diubah menjadi ${formatTanggal(deadline)}, ${formatJam(deadline)}.`
      );

      if (onDeadlineUpdated) await onDeadlineUpdated(currentTask.id, isoString, alasan.trim());
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
              <Text style={styles.pjmkTagText}>HAK AKSES PJMK</Text>
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
              Perubahan deadline ini akan otomatis mengirimkan notifikasi dan
              memperbarui jadwal seluruh anggota kelas.
            </Text>
          </View>

          {/* DEADLINE SAAT INI */}
          <View style={styles.currentDueBox}>
            <Text style={styles.currentDueLabel}>Deadline Saat Ini:</Text>
            <Text style={styles.currentDueValue}>{currentTask.deadline || "-"}</Text>
          </View>

          {/* PILIH TANGGAL & WAKTU (INTERAKTIF TIMESTAMP PICKER) */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Tanggal & Batas Waktu Baru</Text>
            <TouchableOpacity onPress={handleQuickExtend} activeOpacity={0.7}>
              <Text style={styles.quickExtendLink}>+5 Hari Perpanjangan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickersRow}>
            {/* TANGGAL PICKER */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerSubLabel}>Tanggal</Text>
              {Platform.OS === "ios" ? (
                <View style={styles.pickerBoxIos}>
                  <DateTimePicker
                    value={deadline}
                    mode="date"
                    display="compact"
                    locale="id-ID"
                    onChange={(e, d) => d && applyPicked("date", d)}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => openAndroidPicker("date")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerBtnText}>{formatTanggal(deadline)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* WAKTU PICKER */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerSubLabel}>Waktu (Jam)</Text>
              {Platform.OS === "ios" ? (
                <View style={styles.pickerBoxIos}>
                  <DateTimePicker
                    value={deadline}
                    mode="time"
                    display="compact"
                    locale="id-ID"
                    is24Hour
                    onChange={(e, d) => d && applyPicked("time", d)}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => openAndroidPicker("time")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerBtnText}>{formatJam(deadline)}</Text>
                </TouchableOpacity>
              )}
            </View>
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
              placeholder="Contoh: Dosen pengampu memberikan dispensasi penyesuaian materi..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          {/* NOTIFIKASI PREVIEW */}
          <View style={styles.notifPreviewBox}>
            <Text style={styles.notifPreviewText}>
              Notifikasi <Text style={styles.boldText}>"Perubahan Deadline dari PJMK"</Text> akan dikirim ke seluruh mahasiswa kelas.
            </Text>
          </View>

          {/* TOMBOL BATAL & SIMPAN */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
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
                <Text style={styles.saveText}>Simpan & Perbarui</Text>
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
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pjmkTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "bold",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 2,
  },
  taskTargetText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 14,
  },
  noticeBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 11,
    color: "#1E40AF",
    lineHeight: 16,
  },
  currentDueBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  currentDueLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  currentDueValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  quickExtendLink: {
    fontSize: 11,
    color: "#0047BA",
    fontWeight: "700",
  },
  optionalTag: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  pickersRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  pickerCol: {
    flex: 1,
  },
  pickerSubLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  pickerBtn: {
    height: 46,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  pickerBoxIos: {
    height: 46,
    justifyContent: "center",
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputBoxArea: {
    height: 68,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 12,
    color: "#0F172A",
  },
  areaInput: {
    textAlignVertical: "top",
    height: 52,
  },
  notifPreviewBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 16,
  },
  notifPreviewText: {
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
  },
  boldText: {
    fontWeight: "800",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#0047BA",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
