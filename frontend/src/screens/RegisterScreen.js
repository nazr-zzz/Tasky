import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { registerUser } from "../services/auth";

export default function RegisterScreen() {
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Kompatibilitas state sebelumnya
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  // Hitung kekuatan password
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleRegister = async () => {
    if (!nama.trim() || !nim.trim() || !email.trim() || !password) {
      Alert.alert("Perhatian", "Semua kolom wajib diisi.");
      return;
    }

    if (!agreed) {
      Alert.alert("Persetujuan", "Harap setujui Ketentuan Layanan & Kebijakan Privasi Tasky.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(nama.trim(), nim.trim(), email.trim(), password);

      Alert.alert(
        "Registrasi Berhasil! 🎉",
        result.pesan || "Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.",
        [
          {
            text: "Masuk Sekarang",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Registrasi Gagal", error.message || "Terjadi kesalahan saat pendaftaran akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F9FD" />

      {/* Header bar navigasi atas */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.portalBadge}>
          <Text style={styles.portalBadgeIcon}>🎓</Text>
          <Text style={styles.portalBadgeText}>Mahasiswa Portal</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Buat Akun Baru</Text>
        <Text style={styles.subtitle}>
          Bergabung bersama teman sekelas dan jangan lewatkan tugas kuliah lagi.
        </Text>

        {/* Banner Ilustrasi Sesuai Figma */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerCard}>
            <View style={styles.bannerGraphic}>
              <Text style={styles.bannerIconGroup}>🧑‍🎓 💻 👩‍🎓 📚 👨‍🎓</Text>
            </View>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagCheck}>✔</Text>
              <Text style={styles.bannerTagText}>
                Terhubung dengan 140+ Universitas se-Indonesia
              </Text>
            </View>
          </View>
        </View>

        {/* Form Pendaftaran */}
        <View style={styles.card}>
          {/* NAMA LENGKAP */}
          <Text style={styles.label}>Nama Lengkap</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh: Nazril Ilham"
              placeholderTextColor="#98A2B3"
              value={nama}
              onChangeText={setNama}
            />
          </View>

          {/* NIM */}
          <Text style={styles.label}>Nomor Induk Mahasiswa (NIM)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldIcon}>🪪</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh: 2106728192"
              placeholderTextColor="#98A2B3"
              value={nim}
              onChangeText={setNim}
              keyboardType="number-pad"
            />
          </View>
          <Text style={styles.helperText}>
            ⓘ Untuk verifikasi anggota kelas
          </Text>

          {/* EMAIL */}
          <Text style={styles.label}>Email Kampus / Aktif</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="nazril@student.ac.id"
              placeholderTextColor="#98A2B3"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* KATA SANDI */}
          <Text style={styles.label}>Kata Sandi</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="RahasiaAkademik2024!"
              placeholderTextColor="#98A2B3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Indikator Kekuatan Password */}
          <View style={styles.strengthRow}>
            <View style={styles.strengthBars}>
              <View
                style={[
                  styles.strengthSegment,
                  strength >= 1 && { backgroundColor: "#F79009" },
                ]}
              />
              <View
                style={[
                  styles.strengthSegment,
                  strength >= 2 && { backgroundColor: "#FDB022" },
                ]}
              />
              <View
                style={[
                  styles.strengthSegment,
                  strength >= 3 && { backgroundColor: "#2E90FA" },
                ]}
              />
              <View
                style={[
                  styles.strengthSegment,
                  strength >= 4 && { backgroundColor: "#12B76A" },
                ]}
              />
            </View>
            <Text style={styles.strengthText}>
              {strength >= 4
                ? "✔ Kuat"
                : strength >= 3
                ? "Bagus"
                : strength >= 2
                ? "Sedang"
                : "Lemah"}
            </Text>
          </View>

          {/* Persetujuan Ketentuan Layanan */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Saya menyetujui{" "}
              <Text style={styles.termsBold}>Ketentuan Layanan & Kebijakan Privasi</Text>{" "}
              Tasky
            </Text>
          </TouchableOpacity>

          {/* Tombol Daftar */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Daftar Sekarang →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Masuk ke Akun */}
        <View style={styles.footerRow}>
          <Text style={styles.footer}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.link}>Masuk ke Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9FD",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backIcon: {
    fontSize: 20,
    color: "#102A36",
    fontWeight: "bold",
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F0FE",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BAE0FD",
  },
  portalBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  portalBadgeText: {
    fontSize: 12,
    color: "#074C96",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#475467",
    lineHeight: 19,
    marginBottom: 16,
  },
  bannerContainer: {
    marginBottom: 18,
  },
  bannerCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  bannerGraphic: {
    height: 85,
    backgroundColor: "#0F2850",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconGroup: {
    fontSize: 28,
  },
  bannerTag: {
    position: "absolute",
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 25, 47, 0.85)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  bannerTagCheck: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 6,
  },
  bannerTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F4C81",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EAF1F8",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  fieldIcon: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 13,
    color: "#102A36",
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 15,
  },
  helperText: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 10,
    marginTop: 2,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 14,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  strengthSegment: {
    height: 4,
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#12B76A",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  checkboxCheck: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: "#475467",
    lineHeight: 16,
  },
  termsBold: {
    color: "#073B82",
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#073B82",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  footer: {
    fontSize: 13,
    color: "#475467",
  },
  link: {
    fontSize: 13,
    color: "#073B82",
    fontWeight: "800",
  },
});
