import React, { useState, useEffect } from "react";
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
import { kirimKodeReset, resetPasswordDenganKode } from "../services/auth";

export default function LupaPasswordScreen() {
  // Tahap 1: input email | Tahap 2: input kode + kata sandi baru
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [kode, setKode] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Hitung mundur untuk tombol "Kirim ulang kode"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const kirimKode = async () => {
    const emailBersih = email.trim();

    if (!emailBersih) {
      Alert.alert("Perhatian", "Email wajib diisi.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailBersih)) {
      Alert.alert("Perhatian", "Masukkan alamat email yang valid, bukan NIM.");
      return;
    }

    setLoading(true);
    try {
      await kirimKodeReset(emailBersih);
      setStep(2);
      setCooldown(60);
      Alert.alert(
        "Kode Dikirim",
        "Jika email terdaftar, kode 6 digit sudah dikirim. Cek juga folder spam."
      );
    } catch (err) {
      Alert.alert("Gagal", err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const kirimUlang = async () => {
    if (cooldown > 0 || loading) return;
    await kirimKode();
  };

  const simpanPasswordBaru = async () => {
    if (!/^\d{6}$/.test(kode.trim())) {
      Alert.alert("Perhatian", "Kode verifikasi harus 6 digit angka.");
      return;
    }
    if (passwordBaru.length < 8) {
      Alert.alert("Perhatian", "Kata sandi baru minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordDenganKode(email.trim(), kode.trim(), passwordBaru);
      Alert.alert(
        "Berhasil 🎉",
        "Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.",
        [{ text: "Masuk", onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert("Gagal", err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => (step === 2 ? setStep(1) : router.back())}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Lupa Kata Sandi</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? "Masukkan email yang terdaftar. Kami akan mengirimkan kode verifikasi 6 digit ke email tersebut."
            : `Masukkan kode 6 digit yang dikirim ke ${email.trim()} dan kata sandi baru Anda. Kode berlaku 10 menit.`}
        </Text>

        <View style={styles.formContainer}>
          {step === 1 ? (
            <>
              <Text style={styles.fieldLabel}>Email Terdaftar</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputPrefix}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="email@kampus.ac.id"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[styles.mainBtn, loading && styles.btnDisabled]}
                onPress={kirimKode}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainBtnText}>Kirim Kode Verifikasi →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Kode Verifikasi</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputPrefix}>🔢</Text>
                <TextInput
                  style={[styles.textInput, styles.kodeInput]}
                  placeholder="______"
                  placeholderTextColor="#94A3B8"
                  value={kode}
                  onChangeText={(t) => setKode(t.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Text style={styles.fieldLabel}>Kata Sandi Baru</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputPrefix}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#94A3B8"
                  value={passwordBaru}
                  onChangeText={setPasswordBaru}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.mainBtn, loading && styles.btnDisabled]}
                onPress={simpanPasswordBaru}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainBtnText}>Simpan Kata Sandi Baru</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={kirimUlang}
                disabled={cooldown > 0 || loading}
                style={styles.resendBtn}
              >
                <Text
                  style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}
                >
                  {cooldown > 0
                    ? `Kirim ulang kode (${cooldown} dtk)`
                    : "Kirim ulang kode"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 36 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: "700", color: "#073B82" },
  title: { fontSize: 24, fontWeight: "900", color: "#102A36", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#475467", lineHeight: 19, marginBottom: 20 },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#102A36", marginBottom: 6, marginTop: 6 },
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
  inputPrefix: { fontSize: 14, marginRight: 8 },
  textInput: { flex: 1, fontSize: 13, color: "#102A36" },
  kodeInput: { letterSpacing: 6, fontWeight: "700", fontSize: 16 },
  eyeBtn: { padding: 6 },
  eyeIcon: { fontSize: 15 },
  mainBtn: {
    backgroundColor: "#073B82",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnDisabled: { opacity: 0.7 },
  mainBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  resendBtn: { alignItems: "center", marginTop: 14 },
  resendText: { fontSize: 12, fontWeight: "700", color: "#073B82" },
  resendDisabled: { color: "#94A3B8" },
});