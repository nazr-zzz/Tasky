import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Ubah kode error Firebase menjadi pesan yang mudah dipahami
const firebaseMessage = (e) => {
  switch (e?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi salah.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk.";
    case "auth/weak-password":
      return "Kata sandi terlalu lemah (minimal 6 karakter).";
    case "auth/network-request-failed":
      return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
    default:
      return e?.message || "Terjadi kesalahan. Coba lagi.";
  }
};

export default function LoginScreen() {
  const { login, register, authError, deviceBusy } = useAuth();

  // Mode tab: "daftar" | "masuk"
  const [authMode, setAuthMode] = useState("masuk");

  // Form states
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return; // cegah tekan ganda

    // email dibersihkan: spasi dibuang & huruf kecil semua
    const cleanEmail = email.trim().toLowerCase();

    if (authMode === "daftar") {
      // ==================== DAFTAR ====================
      if (!nama.trim() || !nim.trim() || !cleanEmail || !password) {
        Alert.alert("Perhatian", "Semua kolom pendaftaran wajib diisi.");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Perhatian", "Kata sandi minimal 6 karakter.");
        return;
      }
      if (!agreed) {
        Alert.alert("Perhatian", "Harap setujui sinkronisasi jadwal perkuliahan.");
        return;
      }

      setLoading(true);
      try {
        await register({
          name: nama.trim(),
          nim: nim.trim(),
          email: cleanEmail,
          password,
        });
        // Perpindahan ke dashboard ditangani oleh _layout.tsx.
      } catch (err) {
        Alert.alert("Pendaftaran Gagal", firebaseMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      // ==================== MASUK ====================
      if (!cleanEmail || !password) {
        Alert.alert("Perhatian", "Email dan kata sandi wajib diisi.");
        return;
      }

      setLoading(true);
      try {
        await login(cleanEmail, password);
        // Perpindahan ke dashboard ditangani oleh _layout.tsx.
      } catch (error) {
        // DEVICE_BUSY sudah tampil sebagai teks merah + tombol di bawah
        if (error?.code !== "DEVICE_BUSY") {
          Alert.alert("Login Gagal", firebaseMessage(error));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Masuk paksa: keluarkan perangkat lain dari akun ini
  const handleForceLogin = async () => {
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      Alert.alert("Perhatian", "Email dan kata sandi wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      await login(cleanEmail, password, true); // true = keluarkan perangkat lain
    } catch (error) {
      Alert.alert("Login Gagal", firebaseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO & BRAND HEADER */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>Tasky</Text>
              <View style={styles.akademikBadge}>
                <Text style={styles.akademikText}>Akademik</Text>
              </View>
            </View>

            <Text style={styles.brandSubtitle}>
              Sistem Pengingat Tugas Kuliah Berbasis{"\n"}Kelas
            </Text>
          </View>

          {/* TAB SWITCHER: [ DAFTAR ] | [ MASUK ] */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "daftar" && styles.tabButtonActive,
              ]}
              onPress={() => setAuthMode("daftar")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  authMode === "daftar" && styles.tabButtonTextActive,
                ]}
              >
                Daftar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "masuk" && styles.tabButtonActive,
              ]}
              onPress={() => setAuthMode("masuk")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  authMode === "masuk" && styles.tabButtonTextActive,
                ]}
              >
                Masuk
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM DAFTAR / MASUK */}
          <View style={styles.formContainer}>
            {authMode === "daftar" && (
              <>
                {/* NAMA LENGKAP */}
                <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nama lengkap Anda"
                    placeholderTextColor="#94A3B8"
                    value={nama}
                    onChangeText={setNama}
                  />
                </View>

                {/* NIM */}
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Nomor Induk Mahasiswa (NIM)</Text>
                  <Text style={styles.requiredTag}>Wajib</Text>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputPrefix}>#</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan NIM"
                    placeholderTextColor="#94A3B8"
                    value={nim}
                    onChangeText={setNim}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}

            {/* EMAIL */}
            <Text style={styles.fieldLabel}>Email Kampus / Pribadi</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.textInput}
                placeholder="mahasiswa@kampus.ac.id"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
              />
            </View>

            {/* PASSWORD */}
            <Text style={styles.fieldLabel}>Kata Sandi</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {authMode === "masuk" && (
              <TouchableOpacity
                onPress={() => router.push("/lupa-password")}
                style={{ alignSelf: "flex-end", marginBottom: 4 }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#073B82" }}>
                  Lupa kata sandi?
                </Text>
              </TouchableOpacity>
            )}

            {/* PESAN ERROR SESI (mis. akun dipakai di perangkat lain) */}
            {authMode === "masuk" && !!authError && (
              <Text style={styles.errorText}>{authError}</Text>
            )}

            {/* TOMBOL MASUK PAKSA (muncul hanya jika akun dipakai di perangkat lain) */}
            {authMode === "masuk" && deviceBusy && (
              <TouchableOpacity
                onPress={handleForceLogin}
                style={{ marginBottom: 6 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#073B82" }}>
                  Masuk & keluarkan perangkat lain
                </Text>
              </TouchableOpacity>
            )}

            {/* CHECKBOX PERSETUJUAN (KHUSUS DAFTAR) */}
            {authMode === "daftar" && (
              <TouchableOpacity
                style={styles.agreeRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                  {agreed && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.agreeText}>
                  Saya menyetujui sinkronisasi jadwal perkuliahan dan penyimpanan
                  data tugas di server.
                </Text>
              </TouchableOpacity>
            )}

            {/* TOMBOL UTAMA */}
            <TouchableOpacity
              style={[styles.mainSubmitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.mainSubmitText}>
                  {authMode === "daftar" ? "Daftar →" : "Masuk →"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* INFO FOOTER */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="school-outline" size={20} color="#0047BA" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>
                Terintegrasi Dengan Jadwal Kuliah
              </Text>
              <Text style={styles.featureDesc}>
                Kelola tenggat waktu per mata kuliah, notifikasi otomatis sebelum
                kuliah dimulai, dan pembagian tugas kelompok dalam satu aplikasi.
              </Text>
            </View>
          </View>

          {/* LINK SWITCH AKUN SESUAI FIGMA */}
          <TouchableOpacity
            style={styles.switchAuthLink}
            onPress={() => setAuthMode(authMode === "daftar" ? "masuk" : "daftar")}
            activeOpacity={0.7}
          >
            <Text style={styles.switchAuthText}>
              {authMode === "daftar" ? "Sudah punya akun? " : "Belum punya akun? "}
              <Text style={styles.switchAuthBold}>
                {authMode === "daftar" ? "Masuk ke Akun" : "Daftar"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 36,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0B4A8F",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#102A36",
    letterSpacing: -0.5,
  },
  akademikBadge: {
    backgroundColor: "#E0EDFE",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  akademikText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A4DA2",
  },
  brandSubtitle: {
    fontSize: 13,
    color: "#475467",
    textAlign: "center",
    lineHeight: 19,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#073B82",
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475467",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
    marginTop: 6,
  },
  requiredTag: {
    fontSize: 11,
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
    height: 46,
    marginBottom: 10,
  },
  inputPrefix: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: "#102A36",
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 15,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  agreeText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  mainSubmitBtn: {
    backgroundColor: "#073B82",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  mainSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "flex-start",
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E0EDFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: "#475467",
    lineHeight: 16,
  },
  switchAuthLink: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  switchAuthText: {
    fontSize: 13,
    color: "#64748B",
  },
  switchAuthBold: {
    color: "#0047BA",
    fontWeight: "800",
  },
});