import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { createClass } from "../services/api";

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

    setLoading(true);
    try {
      const generatedCode = "PWL-" + Math.floor(1000 + Math.random() * 9000);
      const res = await createClass(
        namaKelas.trim(),
        generatedCode,
        currentUser?.userId || "u_pjmk_dimas"
      );

      const cls = res.kelas || {
        nama_kelas: namaKelas.trim(),
        kode_kelas: generatedCode,
        kelas_id: "k_" + Date.now(),
      };

      setCreatedClass(cls);
      if (onClassCreated) onClassCreated(cls);
    } catch (e) {
      // Fallback offline
      const fallbackCode = "PWL-" + Math.floor(1000 + Math.random() * 9000);
      const fallbackCls = {
        nama_kelas: namaKelas.trim(),
        kode_kelas: fallbackCode,
        kelas_id: "k_" + Date.now(),
        dibuat_oleh: currentUser?.userId || "u_pjmk_dimas",
      };
      setCreatedClass(fallbackCls);
      if (onClassCreated) onClassCreated(fallbackCls);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (Clipboard && Clipboard.setString && createdClass?.kode_kelas) {
      Clipboard.setString(createdClass.kode_kelas);
    }
    Alert.alert("Disalin! 📋", `Kode kelas ${createdClass?.kode_kelas} berhasil disalin ke clipboard.`);
  };

  const handleShare = () => {
    Alert.alert(
      "Bagikan Kode Kelas",
      `Gunakan kode gabung kelas: ${createdClass?.kode_kelas}\nuntuk bergabung ke kelas "${createdClass?.nama_kelas}" di Tasky.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tugas</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "D").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER PERAN PJMK */}
        <View style={styles.pjmkBanner}>
          <View style={styles.pjmkIconBox}>
            <Text style={styles.pjmkIcon}>🛡️</Text>
          </View>
          <View style={styles.pjmkContent}>
            <Text style={styles.pjmkTitle}>Peran: PJMK</Text>
            <Text style={styles.pjmkDesc}>
              Sebagai pembuat kelas, Anda otomatis menjadi Penanggung Jawab Mata
              Kuliah untuk mengelola tugas dan deadline kelas ini.
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
            ⓘ Gunakan format mata kuliah dan paralel kelas yang jelas
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
              <>
                <Text style={styles.createBtnIcon}>⊕</Text>
                <Text style={styles.createBtnText}>Buat Kelas</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* HASIL KELAS BERHASIL DIBUAT (STATUS PENERBITAN) */}
        {createdClass && (
          <View style={styles.successSection}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>

            <Text style={styles.statusLabel}>STATUS PENERBITAN</Text>
            <Text style={styles.successTitle}>Kelas Berhasil Dibuat!</Text>
            <Text style={styles.successSubtitle}>
              Ruang kelas siap digunakan. Mahasiswa dapat mendaftar menggunakan
              token akses unik di bawah ini.
            </Text>

            {/* BIG CODE BOX */}
            <View style={styles.codeBox}>
              <Text style={styles.codeBoxLabel}>KODE KELAS</Text>
              <Text style={styles.codeBoxText}>{createdClass.kode_kelas}</Text>
              <Text style={styles.codeBoxStatus}>● Aktif untuk Semester Ini</Text>
            </View>

            {/* TOMBOL SALIN & BAGIKAN */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Text style={styles.copyBtnText}>📋 Salin Kode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>💬 Bagikan Kode</Text>
              </TouchableOpacity>
            </View>

            {/* TIP BOX */}
            <View style={styles.tipBox}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Bagikan kode ini kepada seluruh mahasiswa anggota kelas agar mereka
                dapat bergabung dan menerima update tugas otomatis.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.offlineFooter}>
          <Text style={styles.offlineFooterText}>
            ☁️ Tersinkronisasi lokal • Siap saat offline
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
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
  pjmkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pjmkIcon: {
    fontSize: 18,
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
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 8,
  },
  textInput: {
    height: 46,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#102A36",
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 14,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#073B82",
    borderRadius: 12,
    height: 46,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  createBtnIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    marginRight: 6,
    fontWeight: "bold",
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  successSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  checkIcon: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  codeBox: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  codeBoxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeBoxText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#073B82",
    letterSpacing: 2,
    marginBottom: 6,
  },
  codeBoxStatus: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "600",
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 14,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#073B82",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tipBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "flex-start",
  },
  tipIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  offlineFooter: {
    alignItems: "center",
    marginTop: 10,
  },
  offlineFooterText: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
