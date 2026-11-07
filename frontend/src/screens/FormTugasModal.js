import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { createTask, updateTask } from "../services/api";

// Pecah teks deadline "16 Nov 2024, 23:59 WIB" menjadi tanggal dan waktu (untuk mode ubah tugas)
function pecahDeadline(deadline) {
  const s = String(deadline || "");
  const idx = s.lastIndexOf(", ");
  if (!s || s === "-" || idx === -1) return { tanggal: "", waktu: "" };
  return { tanggal: s.slice(0, idx), waktu: s.slice(idx + 2) };
}

export default function FormTugasScreen({
  task,
  kelas,
  currentUser,
  onBack,
  onTaskSaved,
}) {
  const isEditing = Boolean(task?.id);

  const awal = pecahDeadline(task?.deadline);

  const [judulTugas, setJudulTugas] = useState(
    task?.title && task.title !== "-" ? task.title : ""
  );
  const [selectedMatkul, setSelectedMatkul] = useState(
    task?.subject && task.subject !== "-" ? task.subject : ""
  );
  const [tanggal, setTanggal] = useState(awal.tanggal);
  const [waktu, setWaktu] = useState(awal.waktu);
  const [deskripsi, setDeskripsi] = useState(task?.description || "");
  const [loading, setLoading] = useState(false);

  const handleSimpanTugas = async () => {
    if (!judulTugas.trim() || !selectedMatkul.trim()) {
      Alert.alert("Perhatian", "Judul tugas dan mata kuliah wajib diisi.");
      return;
    }
    if (!tanggal.trim() || !waktu.trim()) {
      Alert.alert("Perhatian", "Tanggal dan waktu deadline wajib diisi.");
      return;
    }
    if (!kelas?.kelas_id) {
      Alert.alert("Kelas Tidak Ditemukan", "Pilih kelas terlebih dahulu sebelum menambah tugas.");
      return;
    }
    if (!currentUser?.userId) {
      Alert.alert("Sesi Berakhir", "Silakan login ulang.");
      return;
    }

    setLoading(true);
    const deadlineStr = `${tanggal.trim()}, ${waktu.trim()}`;

    try {
      const payload = {
        task_id: isEditing ? String(task.id) : undefined,
        kelas_id: kelas.kelas_id,
        dibuat_oleh: currentUser.userId,
        judul_tugas: judulTugas.trim(),
        mata_kuliah: selectedMatkul.trim(),
        deadline: deadlineStr,
        deskripsi: deskripsi.trim(),
      };

      let res;
      if (isEditing) {
        res = await updateTask(task.id, payload);
      } else {
        res = await createTask(payload);
      }

      Alert.alert(
        "Tugas Berhasil Disimpan! 🎉",
        "Tugas telah tersimpan di server dan dapat dilihat oleh seluruh anggota kelas."
      );

      // Dashboard mengambil ulang data terbaru dari server
      if (onTaskSaved) await onTaskSaved(res);
      if (onBack) onBack();
    } catch (e) {
      Alert.alert("Gagal Menyimpan Tugas", e?.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Ubah Tugas" : "Tambah Tugas Baru"}
        </Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER SINKRONISASI OTOMATIS */}
        <View style={styles.bannerBox}>
          <View style={styles.bannerIconBox}>
            <Text style={styles.bannerIcon}>📬</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              Sinkronisasi Otomatis Anggota Kelas
            </Text>
            <Text style={styles.bannerSubtitle}>
              Tugas yang ditambahkan akan otomatis muncul di seluruh jadwal
              mahasiswa anggota kelas ini.
            </Text>
          </View>
        </View>

        {/* STEP 1: JUDUL TUGAS */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.fieldLabel}>Judul Tugas *</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Langkah 1</Text>
          </View>
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Praktikum 4: Implementasi ORM Prisma"
            placeholderTextColor="#94A3B8"
            value={judulTugas}
            onChangeText={setJudulTugas}
          />
        </View>

        {/* STEP 2: PILIH MATA KULIAH */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.fieldLabel}>Mata Kuliah *</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Langkah 2</Text>
          </View>
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Basis Data"
            placeholderTextColor="#94A3B8"
            value={selectedMatkul}
            onChangeText={setSelectedMatkul}
          />
        </View>

        {/* STEP 3: TENGGAT WAKTU (DEADLINE) */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.fieldLabel}>Tenggat Waktu (Deadline) *</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Langkah 3</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.subFieldLabel}>Tanggal</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>📅</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 16 Nov 2024"
                placeholderTextColor="#94A3B8"
                value={tanggal}
                onChangeText={setTanggal}
              />
            </View>
          </View>

          <View style={styles.timeCol}>
            <Text style={styles.subFieldLabel}>Waktu</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>🕒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 23:59 WIB"
                placeholderTextColor="#94A3B8"
                value={waktu}
                onChangeText={setWaktu}
              />
            </View>
          </View>
        </View>

        {/* STEP 4: DESKRIPSI & PETUNJUK */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.fieldLabel}>Deskripsi & Petunjuk Pengerjaan</Text>
          <Text style={styles.optionalTag}>Opsional</Text>
        </View>
        <View style={[styles.inputBox, styles.textAreaBox]}>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Tuliskan petunjuk pengerjaan, ketentuan file, dll..."
            placeholderTextColor="#94A3B8"
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* STORAGE CARD */}
        <View style={styles.storageCard}>
          <View style={styles.storageLeft}>
            <Text style={styles.storageIcon}>💾</Text>
            <View>
              <Text style={styles.storageTitle}>Penyimpanan Terpadu</Text>
              <Text style={styles.storageSubtitle}>
                Tersimpan di server dan terlihat oleh seluruh anggota kelas
              </Text>
            </View>
          </View>
          <View style={styles.storageCheckCircle}>
            <Text style={styles.storageCheckIcon}>✔</Text>
          </View>
        </View>

        {/* TOMBOL SIMPAN TUGAS */}
        <TouchableOpacity
          style={[styles.saveTaskBtn, loading && styles.btnDisabled]}
          onPress={handleSimpanTugas}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveTaskText}>▶ Simpan Tugas</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={onBack}>
          <Text style={styles.cancelLinkText}>Batal</Text>
        </TouchableOpacity>

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
  bannerBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  bannerIcon: {
    fontSize: 18,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
  },
  stepHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#102A36",
  },
  stepBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  optionalTag: {
    fontSize: 10,
    color: "#94A3B8",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
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
  matkulRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  matkulChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  matkulChipActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  matkulChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475467",
  },
  matkulChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  timeCol: {
    flex: 1,
  },
  subFieldLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  textAreaBox: {
    height: 90,
    paddingVertical: 8,
  },
  textAreaInput: {
    height: "100%",
    textAlignVertical: "top",
  },
  storageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  storageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  storageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  storageTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 2,
  },
  storageSubtitle: {
    fontSize: 10,
    color: "#64748B",
  },
  storageCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  storageCheckIcon: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "bold",
  },
  saveTaskBtn: {
    backgroundColor: "#073B82",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveTaskText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});