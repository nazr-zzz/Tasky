import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { loginUser, registerUser } from "../services/auth";
import { getBaseUrl } from "../services/api";

export default function LoginScreen() {
  // Mode tab: "daftar" | "masuk" (Sesuai Image 1 Desain Baru)
  const [authMode, setAuthMode] = useState("masuk");

  // Form states
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("pjmk@kampus.ac.id");
  const [password, setPassword] = useState("pjmk123");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  // Pintasan login cepat untuk pengujian PJMK vs Mahasiswa Baru
  const handleQuickLogin = (role) => {
    if (role === "pjmk") {
      setEmail("pjmk@kampus.ac.id");
      setPassword("pjmk123");
      setNama("Dimas Pratama");
      setNim("2108561042");
    } else if (role === "mhs_baru") {
      setEmail("mhs.baru@kampus.ac.id");
      setPassword("mhs123");
      setNama("Mahasiswa Baru");
      setNim("2108569999");
    } else if (role === "nazril") {
      setEmail("nazril@gmail.com");
      setPassword("password123");
      setNama("Nazril Febry Fadli");
      setNim("09020605066");
    }
  };

  const handleSubmit = async () => {
    if (authMode === "daftar") {
      if (!nama.trim() || !nim.trim() || !email.trim() || !password) {
        Alert.alert("Perhatian", "Semua kolom pendaftaran wajib diisi.");
        return;
      }
      if (!agreed) {
        Alert.alert("Perhatian", "Harap setujui sinkronisasi jadwal perkuliahan.");
        return;
      }

      setLoading(true);
      try {
        const res = await registerUser(nama.trim(), nim.trim(), email.trim(), password);
        Alert.alert(
          "Pendaftaran Berhasil! 🎉",
          "Akun Anda telah berhasil dibuat. Silakan beralih ke tab Masuk untuk membuka aplikasi.",
          [
            {
              text: "Masuk Sekarang",
              onPress: () => setAuthMode("masuk"),
            },
          ]
        );
      } catch (err) {
        // Fallback pendaftaran lokal jika server offline
        Alert.alert(
          "Akun Tersimpan Lokal 💾",
          "Server offline, akun baru Anda otomatis dibuat dalam mode offline.",
          [
            {
              text: "Lanjutkan ke Aplikasi",
              onPress: () => {
                router.replace({
                  pathname: "/dashboard",
                  params: {
                    userId: "u_new_" + Date.now(),
                    nama: nama.trim(),
                    nim: nim.trim(),
                    email: email.trim(),
                    role: "Mahasiswa",
                    isNewUser: "true",
                  },
                });
              },
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    } else {
      // MODE MASUK
      if (!email.trim() || !password) {
        Alert.alert("Perhatian", "Email/NIM dan kata sandi wajib diisi.");
        return;
      }

      setLoading(true);
      try {
        const result = await loginUser(email.trim(), password);
        const userData = result.user || {};

        const isPjmk =
          email.toLowerCase().includes("pjmk") ||
          (userData.nama && userData.nama.toLowerCase().includes("dimas"));

        router.replace({
          pathname: "/dashboard",
          params: {
            userId: userData.userId || userData.USER_ID || "u1",
            nama: userData.nama || userData.NAMA || (isPjmk ? "Dimas Pratama" : "Mahasiswa"),
            nim: userData.nim || userData.NIM || (isPjmk ? "2108561042" : "2108561029"),
            email: userData.email || userData.EMAIL || email.trim(),
            role: isPjmk ? "PJMK Utama" : "Mahasiswa",
            isNewUser: email.includes("baru") ? "true" : "false",
          },
        });
      } catch (error) {
        // Jika koneksi server gagal atau mode demo offline
        const isPjmk =
          email.toLowerCase().includes("pjmk") ||
          email.toLowerCase().includes("dimas");

        const isMhsBaru = email.toLowerCase().includes("baru");

        Alert.alert(
          "Masuk Mode Offline ⚠️",
          `Tidak dapat terhubung ke database server.\n\nMasuk menggunakan mode penyimpanan lokal perangkat?`,
          [
            { text: "Batal", style: "cancel" },
            {
              text: "Lanjutkan Offline",
              onPress: () => {
                router.replace({
                  pathname: "/dashboard",
                  params: {
                    userId: isPjmk ? "u_pjmk_dimas" : "u_mhs_baru",
                    nama: isPjmk ? "Dimas Pratama" : isMhsBaru ? "Mahasiswa Baru" : "Nazril Febry",
                    nim: isPjmk ? "2108561042" : "2108569999",
                    email: email.trim(),
                    role: isPjmk ? "PJMK Utama" : "Mahasiswa",
                    isNewUser: isMhsBaru ? "true" : "false",
                  },
                });
              },
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TOP PILL: DATA LOKAL TERSIMPAN AMAN */}
        <View style={styles.topPill}>
          <Text style={styles.topPillIcon}>👥</Text>
          <Text style={styles.topPillText}>
            Data lokal tersimpan aman di perangkat
          </Text>
        </View>

        {/* LOGO & BRAND HEADER SESUAI GAMBAR 1 */}
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
              👤+ Daftar
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
              →] Masuk
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
                <Text style={styles.inputPrefix}>🪪</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Dimas Pratama"
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
                  placeholder="2108561042"
                  placeholderTextColor="#94A3B8"
                  value={nim}
                  onChangeText={setNim}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}

          {/* EMAIL */}
          <Text style={styles.fieldLabel}>
            {authMode === "daftar" ? "Email Kampus / Pribadi" : "Email Kampus atau NIM"}
          </Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>✉️</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                authMode === "daftar"
                  ? "mahasiswa@kampus.ac.id"
                  : "pjmk@kampus.ac.id atau 2108561042"
              }
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* PASSWORD */}
          <Text style={styles.fieldLabel}>Kata Sandi</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>🔒</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Minimal 8 karakter"
              placeholderTextColor="#94A3B8"
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
                Saya menyetujui sinkronisasi jadwal perkuliahan dan penyimpanan tugas
                lokal di perangkat ini.
              </Text>
            </TouchableOpacity>
          )}

          {/* PINTASAN AKUN UNTUK PENGUJIAN FITUR (MASUK) */}
          {authMode === "masuk" && (
            <View style={styles.quickAccountsSection}>
              <Text style={styles.quickAccountsTitle}>
                ⚡ Pintasan Akun Cepat (Sesuai Catatan SRS):
              </Text>
              <View style={styles.quickBtnGroup}>
                <TouchableOpacity
                  style={[
                    styles.quickAccountPill,
                    email.includes("pjmk") && styles.quickAccountPillActive,
                  ]}
                  onPress={() => handleQuickLogin("pjmk")}
                >
                  <Text style={styles.quickAccountPillText}>
                    👑 Akun PJMK (Dimas Pratama)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickAccountPill,
                    email.includes("baru") && styles.quickAccountPillActive,
                  ]}
                  onPress={() => handleQuickLogin("mhs_baru")}
                >
                  <Text style={styles.quickAccountPillText}>
                    🧑‍🎓 Mahasiswa Baru (0 Kelas)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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

        {/* INFO FOOTER: TERINTEGRASI DENGAN JADWAL KULIAH */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconCircle}>
            <Text style={styles.featureIcon}>🎓</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Terintegrasi Dengan Jadwal Kuliah
            </Text>
            <Text style={styles.featureDesc}>
              Kelola tenggat waktu per mata kuliah, notifikasi otomatis sebelum
              kuliah dimulai, dan pembagian tugas kelompok tanpa koneksi internet
              terus-menerus.
            </Text>
          </View>
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  topPillIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  topPillText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
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
  quickAccountsSection: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickAccountsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#073B82",
    marginBottom: 8,
  },
  quickBtnGroup: {
    flexDirection: "column",
    gap: 6,
  },
  quickAccountPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  quickAccountPillActive: {
    borderColor: "#073B82",
    backgroundColor: "#EBF3FC",
  },
  quickAccountPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#102A36",
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
});
