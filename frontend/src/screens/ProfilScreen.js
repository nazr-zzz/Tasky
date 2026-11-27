import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "../services/api";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value && value.length > 0 ? value : "-"}</Text>
  </View>
);

export default function ProfilScreen({
  currentUser,
  serverStatus,
  ipValue,
  onChangeIp,
  onSaveIp,
  checking,
  backendPort,
  onLogout,
  bottomSpace = 90,
  onProfileUpdated,
}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [namaInput, setNamaInput] = useState(currentUser?.nama || "");
  const [semesterInput, setSemesterInput] = useState(
    currentUser?.semester ? String(currentUser.semester) : "1"
  );
  const [fotoUri, setFotoUri] = useState(currentUser?.foto || null);
  const [saving, setSaving] = useState(false);

  const initial = (currentUser?.nama || "?").charAt(0).toUpperCase();

  const handleOpenEdit = () => {
    setNamaInput(currentUser?.nama || "");
    setSemesterInput(currentUser?.semester ? String(currentUser.semester) : "1");
    setFotoUri(currentUser?.foto || null);
    setEditModalVisible(true);
  };

  const handlePilihFoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Izin Galeri Diperlukan",
            "Aplikasi memerlukan izin akses galeri foto untuk mengubah foto profil."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setFotoUri(base64Data);
      }
    } catch (e) {
      Alert.alert("Gagal Memilih Foto", e?.message || "Terjadi kesalahan saat membuka galeri.");
    }
  };

  const handleHapusFoto = () => {
    setFotoUri(null);
  };

  const handleSimpanProfil = async () => {
    if (!namaInput.trim()) {
      Alert.alert("Perhatian", "Nama lengkap tidak boleh kosong.");
      return;
    }

    const semAngka = Number(semesterInput);
    if (!Number.isInteger(semAngka) || semAngka < 1 || semAngka > 14) {
      Alert.alert("Perhatian", "Semester harus berupa angka antara 1 sampai 14.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(currentUser.userId, {
        nama: namaInput.trim(),
        semester: semAngka,
        foto: fotoUri,
      });

      const updated = {
        nama: namaInput.trim(),
        semester: semAngka,
        foto: fotoUri,
      };

      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      Alert.alert("Berhasil", "Biodata profil dan foto Anda telah berhasil diperbarui.");
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert("Gagal Memperbarui Profil", e?.message || "Tidak dapat terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Keluar", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: onLogout },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomSpace + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* AVATAR & NAMA */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {currentUser?.foto ? (
            <Image
              source={{ uri: currentUser.foto }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>

        <Text style={styles.name}>{currentUser?.nama || "-"}</Text>
        <Text style={styles.roleText}>{currentUser?.role || "Mahasiswa"}</Text>

        {/* TOMBOL EDIT PROFIL */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={handleOpenEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileBtnText}>Edit Biodata & Foto</Text>
        </TouchableOpacity>
      </View>

      {/* BIODATA KARTU */}
      <View style={styles.card}>
        <Row label="Nama Lengkap" value={currentUser?.nama} />
        <Row label="NIM" value={currentUser?.nim} />
        <Row label="Email" value={currentUser?.email} />
        <Row
          label="Semester"
          value={currentUser?.semester ? `Semester ${currentUser.semester}` : "Semester 1"}
        />
        <Row label="Peran Akun" value={currentUser?.role || "Mahasiswa"} />
      </View>

      {/* KONEKSI SERVER */}
      <Text style={styles.sectionTitle}>Koneksi Server</Text>
      <View style={styles.card}>
        <Text style={styles.value}>{serverStatus}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>
          IP LAN Backend (Port {String(backendPort)})
        </Text>
        <TextInput
          style={styles.input}
          value={ipValue}
          onChangeText={onChangeIp}
          placeholder="Contoh: 192.168.1.10"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSaveIp}
          disabled={checking}
        >
          <Text style={styles.saveBtnText}>
            {checking ? "Mengecek..." : "Simpan & Tes Koneksi"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KELUAR */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Keluar dari Akun</Text>
      </TouchableOpacity>

      {/* MODAL EDIT PROFIL */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Biodata Mahasiswa</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* FOTO PROFIL SECTION */}
              <View style={styles.fotoSection}>
                <View style={styles.modalAvatarBox}>
                  {fotoUri ? (
                    <Image
                      source={{ uri: fotoUri }}
                      style={styles.modalAvatarImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.modalAvatarInitial}>{initial}</Text>
                  )}
                </View>

                <View style={styles.fotoBtnRow}>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={handlePilihFoto}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadBtnText}>Pilih Foto Galeri</Text>
                  </TouchableOpacity>

                  {fotoUri ? (
                    <TouchableOpacity
                      style={styles.removeFotoBtn}
                      onPress={handleHapusFoto}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeFotoBtnText}>Hapus Foto</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text style={styles.fotoHint}>
                  Foto bersifat opsional (format JPG/PNG maks. 2MB)
                </Text>
              </View>

              {/* INPUT NAMA */}
              <Text style={styles.inputFieldLabel}>NAMA LENGKAP</Text>
              <TextInput
                style={styles.modalInput}
                value={namaInput}
                onChangeText={setNamaInput}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#94A3B8"
              />

              {/* INPUT SEMESTER */}
              <Text style={[styles.inputFieldLabel, { marginTop: 14 }]}>
                SEMESTER (1 - 14)
              </Text>
              <TextInput
                style={styles.modalInput}
                value={semesterInput}
                onChangeText={(t) => setSemesterInput(t.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="Semester (1 - 14)"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />

              {/* QUICK CHIP SEMESTER */}
              <View style={styles.semesterChips}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.modalSemChip,
                      semesterInput === String(s) && styles.modalSemChipActive,
                    ]}
                    onPress={() => setSemesterInput(String(s))}
                  >
                    <Text
                      style={[
                        styles.modalSemChipText,
                        semesterInput === String(s) && styles.modalSemChipTextActive,
                      ]}
                    >
                      Smt {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* TOMBOL SIMPAN */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmSaveBtn}
                  onPress={handleSimpanProfil}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmSaveBtnText}>Simpan Perubahan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#BFDBFE",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#1D4ED8" },
  name: { fontSize: 19, fontWeight: "800", color: "#0F172A" },
  roleText: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  editProfileBtn: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  label: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginTop: 6,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#0047BA",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: { color: "#DC2626", fontWeight: "800", fontSize: 14 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },
  fotoSection: {
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalAvatarBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    overflow: "hidden",
    marginBottom: 10,
  },
  modalAvatarImg: {
    width: "100%",
    height: "100%",
  },
  modalAvatarInitial: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  fotoBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  uploadBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  removeFotoBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removeFotoBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  fotoHint: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  semesterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  modalSemChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalSemChipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  modalSemChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  modalSemChipTextActive: {
    color: "#1D4ED8",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  confirmSaveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0047BA",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
