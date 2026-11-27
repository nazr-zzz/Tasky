import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { createClass } from "../services/api";

// Buat kode undangan acak 6 karakter (huruf besar & angka, tanpa karakter yang mudah tertukar)
function buatKodeKelas() {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let kode = "";
  for (let i = 0; i < 6; i++) {
    kode += huruf.charAt(Math.floor(Math.random() * huruf.length));
  }
  return kode;
}

export default function BuatKelasScreen({
  currentUser,
  onBack,
  onClassCreated,
}) {
  const [namaKelas, setNamaKelas] = useState("");
  const [createdClass, setCreatedClass] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBuatKelas = async () => {
    if (!namaKelas.trim()) {
      Alert.alert("Perhatian", "Nama mata kuliah dan kelas wajib diisi.");
      return;
    }

    if (!currentUser?.userId) {
      Alert.alert("Sesi Berakhir", "Silakan login ulang.");
      return;
    }

    setLoading(true);
    try {
      const generatedCode = buatKodeKelas();
      const res = await createClass(
        namaKelas.trim(),
        generatedCode,
        currentUser.userId
      );

      // Pakai data dari server; jika server tidak mengirim detail, pakai kode yang baru dibuat
      const dariServer = res?.kelas || {};
      const cls = {
        ...dariServer,
        nama_kelas:
          dariServer.nama_kelas ?? dariServer.NAMA_KELAS ?? namaKelas.trim(),
        kode_kelas:
          dariServer.kode_kelas ?? dariServer.KODE_KELAS ?? generatedCode,
        kelas_id: dariServer.kelas_id ?? dariServer.KELAS_ID,
      };

      setCreatedClass(cls);
      if (onClassCreated) await onClassCreated(cls);
    } catch (e) {
      Alert.alert(
        "Gagal Membuat Kelas",
        e?.message || "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdClass?.kode_kelas) return;
    try {
      await Clipboard.setStringAsync(String(createdClass.kode_kelas));
      Alert.alert(
        "Disalin!",
        `Kode kelas ${createdClass.kode_kelas} berhasil disalin ke clipboard.`
      );
    } catch (e) {
      Alert.alert("Gagal", "Kode kelas tidak dapat disalin.");
    }
  };

  const handleShare = () => {
    Alert.alert(
      "Bagikan Kode Kelas",
      `Gunakan kode gabung kelas: ${createdClass?.kode_kelas}\nuntuk bergabung ke kelas "${createdClass?.nama_kelas}" di Tasky.`
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Kelas (PJMK)</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "P").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BANNER PERAN PJMK SESUAI FIGMA */}
        <View style={styles.pjmkBanner}>
          <View style={styles.pjmkIconBox}>
            <Ionicons name="shield-checkmark" size={18} color="#0047BA" />
          </View>
          <View style={styles.pjmkContent}>
            <Text style={styles.pjmkTitle}>Peran: PJMK</Text>
            <Text style={styles.pjmkDesc}>
              Sebagai pembuat kelas, Anda otomatis menjadi Penanggung Jawab Mata Kuliah untuk mengelola tugas dan deadline kelas ini.
            </Text>
          </View>
        </View>

        {/* INPUT NAMA MATA KULIAH & KELAS */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Nama Mata Kuliah & Kelas</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Pemrograman Web Lanjut - Kelas D"
            placeholderTextColor="#94A3B8"
            value={namaKelas}
            onChangeText={setNamaKelas}
          />
          <Text style={styles.helperText}>
            Gunakan format mata kuliah dan paralel kelas yang jelas
          </Text>

          <TouchableOpacity
            style={[styles.createBtn, loading && styles.btnDisabled]}
            onPress={handleBuatKelas}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.createBtnText}>Buat Kelas</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* HASIL KELAS BERHASIL DIBUAT */}
        {createdClass && (
          <View style={styles.successSection}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>

            <Text style={styles.statusLabel}>STATUS PENERBITAN</Text>
            <Text style={styles.successTitle}>Kelas Berhasil Dibuat!</Text>
            <Text style={styles.successSubtitle}>
              Ruang kelas siap digunakan. Mahasiswa dapat mendaftar menggunakan
              kode akses unik di bawah ini.
            </Text>

            {/* KOTAK KODE */}
            <View style={styles.codeBox}>
              <Text style={styles.codeBoxLabel}>KODE KELAS</Text>
              <Text style={styles.codeBoxText}>{createdClass.kode_kelas}</Text>
              <Text style={styles.codeBoxStatus}>
                ● Aktif untuk Semester Ini
              </Text>
            </View>

            {/* TOMBOL SALIN & BAGIKAN */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Text style={styles.copyBtnText}>Salin Kode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>Bagikan Kode</Text>
              </TouchableOpacity>
            </View>

            {/* TIP */}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                Bagikan kode ini kepada seluruh mahasiswa anggota kelas agar
                mereka dapat bergabung dan menerima update tugas otomatis.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    color: "#102A36",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#102A36",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0EDFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE0FD",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#073B82",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
  },
  pjmkBanner: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  pjmkContent: {
    flex: 1,
  },
  pjmkTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 4,
  },
  pjmkDesc: {
    fontSize: 12,
    color: "#3B82F6",
    lineHeight: 17,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#102A36",
    backgroundColor: "#F8FAFC",
  },
  helperText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: "#0B4A9E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  successSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 28,
    color: "#16A34A",
    fontWeight: "bold",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 6,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  codeBox: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  codeBoxLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeBoxText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0B4A9E",
    letterSpacing: 6,
  },
  codeBoxStatus: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 6,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 16,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: "#0B4A9E",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  copyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#EBF3FC",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  shareBtnText: {
    color: "#0B4A9E",
    fontSize: 14,
    fontWeight: "700",
  },
  tipBox: {
    width: "100%",
    backgroundColor: "#FEF9C3",
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    fontSize: 12,
    color: "#854D0E",
    lineHeight: 18,
  },
});