import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import ScreenHeader from "../components/BackButton";
import { createTask, updateTask } from "../services/api";
import { pick, parsePoin, getTaskDeadlineDate, formatTanggal, formatJam } from "../utils/deadline";

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  return d;
}

export default function FormTugasScreen({ task, kelas, currentUser, onBack, onTaskSaved }) {
  const isEditing = Boolean(task?.id);

  const deadlineAwal = getTaskDeadlineDate(task);

  const [judulTugas, setJudulTugas] = useState(task?.title && task.title !== "-" ? task.title : "");
  const [selectedMatkul, setSelectedMatkul] = useState(
    task?.subject && task.subject !== "-" ? task.subject : ""
  );
  const [dosen, setDosen] = useState(pick(task, "dosen", "DOSEN") || "");
  const [modul, setModul] = useState(pick(task, "modul", "MODUL") || "");
  const [deadline, setDeadline] = useState(deadlineAwal || defaultDeadline());
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [deskripsi, setDeskripsi] = useState(pick(task, "description", "deskripsi", "DESKRIPSI") || "");
  const [poinKunci, setPoinKunci] = useState(() => {
    const p = parsePoin(pick(task, "poinKunci", "poin_kunci", "POIN_KUNCI_LIST", "POIN_KUNCI"));
    return p.length ? p : [""];
  });
  const [link, setLink] = useState(pick(task, "linkPengumpulan", "link_pengumpulan", "LINK_PENGUMPULAN") || "");
  const [loading, setLoading] = useState(false);

  // ---------- Date & time picker ----------
  const applyPicked = (mode, picked) => {
    setDeadline((prev) => {
      const n = new Date(prev);
      if (mode === "date") n.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      else n.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return n;
    });
    setDeadlineTouched(true);
  };

  const openAndroidPicker = (mode) => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode,
      is24Hour: true,
      minimumDate: mode === "date" && !isEditing ? new Date() : undefined,
      onChange: (event, picked) => {
        if (event.type === "set" && picked) applyPicked(mode, picked);
      },
    });
  };

  // ---------- Poin kunci dinamis ----------
  const ubahPoin = (i, val) => setPoinKunci((arr) => arr.map((p, idx) => (idx === i ? val : p)));
  const tambahPoin = () => setPoinKunci((arr) => (arr.length >= 10 ? arr : [...arr, ""]));
  const hapusPoin = (i) =>
    setPoinKunci((arr) => (arr.length === 1 ? [""] : arr.filter((_, idx) => idx !== i)));

  const handleSimpanTugas = async () => {
    if (!judulTugas.trim() || !selectedMatkul.trim()) {
      Alert.alert("Perhatian", "Judul tugas dan mata kuliah wajib diisi.");
      return;
    }
    if (!isEditing && deadline.getTime() < Date.now()) {
      Alert.alert("Perhatian", "Deadline tidak boleh di waktu yang sudah lewat.");
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

    let linkBersih = link.trim();
    if (linkBersih && !/^https?:\/\//i.test(linkBersih)) linkBersih = `https://${linkBersih}`;

    setLoading(true);
    try {
      const payload = {
        task_id: isEditing ? String(task.id) : undefined,
        kelas_id: kelas.kelas_id,
        dibuat_oleh: currentUser.userId,
        diubah_oleh: currentUser.userId,
        judul_tugas: judulTugas.trim(),
        mata_kuliah: selectedMatkul.trim(),
        dosen: dosen.trim(),
        modul: modul.trim(),
        deskripsi: deskripsi.trim(),
        poin_kunci: poinKunci.map((p) => p.trim()).filter(Boolean),
        link_pengumpulan: linkBersih,
      };

      // Deadline dikirim sebagai ISO agar sama persis dengan yang dipilih
      if (!isEditing || deadlineTouched || deadlineAwal) {
        payload.deadline = deadline.toISOString();
      }

      const res = isEditing ? await updateTask(task.id, payload) : await createTask(payload);

      Alert.alert("Tugas Berhasil Disimpan! 🎉", "Tugas telah tersimpan dan dapat dilihat oleh seluruh anggota kelas.");

      if (onTaskSaved) await onTaskSaved(res);
      if (onBack) onBack();
    } catch (e) {
      Alert.alert("Gagal Menyimpan Tugas", e?.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScreenHeader
        title={isEditing ? "Ubah Tugas" : "Tambah Tugas Baru"}
        onBack={onBack}
        initial={currentUser?.nama || "?"}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.bannerBox}>
            <View style={styles.bannerIconBox}>
              <Text style={styles.bannerIcon}>📬</Text>
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Sinkronisasi Otomatis Anggota Kelas</Text>
              <Text style={styles.bannerSubtitle}>
                Tugas yang ditambahkan akan otomatis muncul di seluruh jadwal mahasiswa anggota kelas ini.
              </Text>
            </View>
          </View>

          <Field label="Judul Tugas *" badge="Langkah 1">
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Praktikum 4: Implementasi ORM Prisma"
                placeholderTextColor="#94A3B8"
                value={judulTugas}
                onChangeText={setJudulTugas}
              />
            </View>
          </Field>

          <Field label="Mata Kuliah *" badge="Langkah 2">
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Basis Data"
                placeholderTextColor="#94A3B8"
                value={selectedMatkul}
                onChangeText={setSelectedMatkul}
              />
            </View>
          </Field>

          <Field label="Tenggat Waktu (Deadline) *" badge="Langkah 3">
            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Text style={styles.subFieldLabel}>Tanggal</Text>
                {Platform.OS === "ios" ? (
                  <View style={styles.pickerBoxIos}>
                    <DateTimePicker
                      value={deadline}
                      mode="date"
                      display="compact"
                      locale="id-ID"
                      minimumDate={!isEditing ? new Date() : undefined}
                      onChange={(e, d) => d && applyPicked("date", d)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => openAndroidPicker("date")}>
                    <Text style={styles.inputIcon}>📅</Text>
                    <Text style={styles.pickerText}>{formatTanggal(deadline)}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.timeCol}>
                <Text style={styles.subFieldLabel}>Waktu</Text>
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
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => openAndroidPicker("time")}>
                    <Text style={styles.inputIcon}>🕒</Text>
                    <Text style={styles.pickerText}>{formatJam(deadline)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Field>

          <Field label="Dosen Pengampu" badge="Opsional">
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Dr. Aris Munandar, M.Kom"
                placeholderTextColor="#94A3B8"
                value={dosen}
                onChangeText={setDosen}
              />
            </View>
          </Field>

          <Field label="Modul / Pertemuan" badge="Opsional">
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Modul 4 / Pertemuan 7"
                placeholderTextColor="#94A3B8"
                value={modul}
                onChangeText={setModul}
              />
            </View>
          </Field>

          <Field label="Deskripsi & Petunjuk Pengerjaan" badge="Opsional">
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
          </Field>

          <Field label="Poin Kunci Pengerjaan" badge="Opsional">
            {poinKunci.map((p, i) => (
              <View key={i} style={styles.poinRow}>
                <View style={[styles.inputBox, styles.poinInput]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Poin ${i + 1}`}
                    placeholderTextColor="#94A3B8"
                    value={p}
                    onChangeText={(v) => ubahPoin(i, v)}
                  />
                </View>
                <TouchableOpacity
                  style={styles.poinRemoveBtn}
                  onPress={() => hapusPoin(i)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.poinRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPoinBtn} onPress={tambahPoin}>
              <Text style={styles.addPoinText}>＋ Tambah Poin</Text>
            </TouchableOpacity>
          </Field>

          <Field label="Tautan Pengumpulan" badge="Opsional">
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>🔗</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: classroom.google.com/..."
                placeholderTextColor="#94A3B8"
                value={link}
                onChangeText={setLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </Field>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, badge, children }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={styles.stepHeaderRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{badge}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
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
  bannerIcon: { fontSize: 18 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 12, fontWeight: "800", color: "#1E40AF", marginBottom: 2 },
  bannerSubtitle: { fontSize: 11, color: "#3B82F6", lineHeight: 16 },
  stepHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: "#102A36", flex: 1 },
  stepBadge: { backgroundColor: "#F1F5F9", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  stepBadgeText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputIcon: { fontSize: 14, marginRight: 8 },
  textInput: { flex: 1, fontSize: 13, color: "#102A36" },
  timeRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  timeCol: { flex: 1 },
  subFieldLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", marginBottom: 4 },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  pickerText: { fontSize: 13, color: "#102A36", fontWeight: "600" },
  pickerBoxIos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 6,
    height: 48,
    marginBottom: 14,
  },
  textAreaBox: { height: 100, paddingVertical: 8, alignItems: "flex-start" },
  textAreaInput: { height: "100%", textAlignVertical: "top" },
  poinRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  poinInput: { flex: 1 },
  poinRemoveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  poinRemoveText: { fontSize: 14, fontWeight: "800", color: "#DC2626" },
  addPoinBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  addPoinText: { fontSize: 12, fontWeight: "800", color: "#1D4ED8" },
  saveTaskBtn: {
    backgroundColor: "#073B82",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.7 },
  saveTaskText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  cancelLink: { alignItems: "center", paddingVertical: 12 },
  cancelLinkText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
});