import React, { useState } from "react";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function RegisterScreen() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    if (!nama || !email || !password || !confirmPassword) {
      Alert.alert("Perhatian", "Semua kolom wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Perhatian", "Konfirmasi kata sandi tidak cocok.");
      return;
    }

    Alert.alert(
      "Registrasi",
      "Formulir berhasil divalidasi. Fitur pendaftaran akun belum terhubung ke backend.",
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>

        <Text style={styles.title}>Buat Akun Tasky</Text>
        <Text style={styles.subtitle}>
          Daftar untuk mulai mengatur tugas dan deadline kuliahmu.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama lengkap"
            value={nama}
            onChangeText={setNama}
          />

          <Text style={styles.label}>Email Kampus atau NIM</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan email atau NIM"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Kata Sandi</Text>
          <TextInput
            style={styles.input}
            placeholder="Buat kata sandi"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
          <TextInput
            style={styles.input}
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Daftar Sekarang →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Sudah punya akun?{" "}
          <Text style={styles.link} onPress={() => router.replace("/")}>
            Masuk
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F7FF",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#244A85",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1D3557",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7C93",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 20,
    elevation: 3,
  },
  label: {
    color: "#263B59",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE5F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    backgroundColor: "#FBFCFE",
  },
  button: {
    backgroundColor: "#244A85",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 26,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  footer: {
    textAlign: "center",
    color: "#6B7C93",
    marginTop: 24,
  },
  link: {
    color: "#244A85",
    fontWeight: "bold",
  },
});
