import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { createTask, updateTask } from "../services/api";

export default function TambahTugasModal({
  visible,
  currentUser,
  currentClass,
  editingTask,
  onClose,
  onTaskSaved,
}) {
  const [judulTugas, setJudulTugas] = useState(editingTask?.title || "");
  const [mataKuliah, setMataKuliah] = useState(
    editingTask?.subject || currentClass?.nama_kelas || "Basis Data A"
  );
  const [deadline, setDeadline] = useState(editingTask?.deadline || "Besok, 23:59 WIB");
  const [deskripsi, setDeskripsi] = useState(editingTask?.description || "");
  const [lampiran, setLampiran] = useState(editingTask?.attachment || "PDF / Dokumen");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!judulTugas.trim() || !mataKuliah.trim() || !deadline.trim()) {
      Alert.alert("Perhatian", "Judul tugas, mata kuliah, dan deadline wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const taskPayload = {
        task_id: editingTask?.id ? String(editingTask.id) : undefined,
        kelas_id: currentClass?.kelas_id || "k1",
        dibuat_oleh: currentUser?.userId || "u1",
        judul_tugas: judulTugas.trim(),
        mata_kuliah: mataKuliah.trim(),
        deadline: deadline.trim(),
        deskripsi: deskripsi.trim(),
      };

      if (editingTask?.id) {
        await updateTask(editingTask.id, {
          ...taskPayload,
          diubah_oleh: currentUser?.userId || "u1",
        });
      } else {
        await createTask(taskPayload);
      }

      const newTaskObj = {
        id: editingTask?.id || Date.now(),
        subject: mataKuliah.trim(),
        title: judulTugas.trim(),
        deadline: deadline.trim(),
        countdown: deadline.includes("Besok") ? "H-1" : "H-3",
        creator: `Dibuat oleh PJMK (${currentUser?.nama || "Anda"})`,
        attachment: lampiran,
        status: "Belum Dikerjakan",
        color: "#4D9BFF",
      };

      if (onTaskSaved) onTaskSaved(newTaskObj);
      Alert.alert(
        "Tugas Berhasil Disimpan! 🎉",
        "Tugas telah diterbitkan dan dapat dilihat oleh seluruh anggota kelas."
      );
      onClose();
    } catch (e) {
      // Fallback offline jika server tidak aktif
      const fallbackTask = {
        id: editingTask?.id || Date.now(),
        subject: mataKuliah.trim(),
        title: judulTugas.trim(),
        deadline: deadline.trim(),
        countdown: deadline.includes("Besok") ? "H-1" : "H-3",
        creator: `Dibuat oleh PJMK (${currentUser?.nama || "Anda"})`,
        attachment: lampiran,
        status: "Belum Dikerjakan",
        color: "#FFB632",
      };
      if (onTaskSaved) onTaskSaved(fallbackTask);
      Alert.alert(
        "Tersimpan Secara Lokal",
        "Tugas berhasil ditambahkan ke daftar tugas Anda."
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {editingTask ? "Ubah Tugas Kelas" : "Tambah Tugas Baru"}
          </Text>
          <Text style={styles.subtitle}>
            Tugas yang Anda buat akan otomatis muncul pada kalender & daftar tugas seluruh mahasiswa sekelas.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Judul Tugas</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Normalisasi ERD & Skema Relasional"
              placeholderTextColor="#98A2B3"
              value={judulTugas}
              onChangeText={setJudulTugas}
            />

            <Text style={styles.label}>Mata Kuliah</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Basis Data A"
              placeholderTextColor="#98A2B3"
              value={mataKuliah}
              onChangeText={setMataKuliah}
            />

            <Text style={styles.label}>Tenggat Waktu (Deadline)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Besok, 23:59 WIB atau 2026-11-10 23:59"
              placeholderTextColor="#98A2B3"
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text style={styles.label}>Jenis Lampiran / Pengumpulan</Text>
            <View style={styles.attachmentOptions}>
              {["PDF / Dokumen", "Source Code (C/Java)", "GitHub Repo Link"].map(
                (item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.attachChip,
                      lampiran === item && styles.attachChipActive,
                    ]}
                    onPress={() => setLampiran(item)}
                  >
                    <Text
                      style={[
                        styles.attachChipText,
                        lampiran === item && styles.attachChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.label}>Deskripsi & Petunjuk Tugas (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tuliskan petunjuk pengerjaan tugas, format penamaan file, dll..."
              placeholderTextColor="#98A2B3"
              value={deskripsi}
              onChangeText={setDeskripsi}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>
                  {editingTask ? "Perbarui Tugas" : "Terbitkan Tugas"}
                </Text>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#475467",
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#102A36",
    backgroundColor: "#F8FAFC",
  },
  textArea: {
    height: 75,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  attachmentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  attachChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attachChipActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  attachChipText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
  },
  attachChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  cancelText: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "600",
  },
  saveBtn: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#073B82",
  },
  saveText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
