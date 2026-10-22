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
} from "react-native";
import { router } from "expo-router";
import { loginUser } from "../services/auth";





export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  

const handleLogin = async () => {
  if (!email.trim() || !password) {
    Alert.alert("Perhatian", "Email/NIM dan kata sandi wajib diisi.");
    return;
  }

  try {
    const result = await loginUser(email.trim(), password);

    
    console.log("Data pengguna:", result.user);
    router.replace({
      pathname: "/dashboard",
      params: {
        userId: result.user.userId,
        nama: result.user.nama,
        nim: result.user.nim,
        email: result.user.email,
      },
    });

    // Navigasi ke dashboard kita tambahkan setelah halamannya dibuat.
  } catch (error) {
    Alert.alert("Login Gagal", error.message);
  }
};



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F8FF" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bagian header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>T</Text>
          </View>

          <Text style={styles.title}>Selamat Datang Kembali!</Text>

          <Text style={styles.subtitle}>
            Masuk untuk memantau tugas kelas
            {"\n"}dan deadline terbaru.
          </Text>
        </View>

        {/* Form login */}
        <View style={styles.form}>
          <Text style={styles.label}>Email Kampus atau NIM</Text>

          <TextInput
            style={styles.input}
            placeholder="contoh@ui.ac.id atau 2106012..."
            placeholderTextColor="#98A2B3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="default"
          />

          <Text style={styles.label}>Kata Sandi</Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan kata sandi"
            placeholderTextColor="#98A2B3"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Ingat saya dan lupa password */}
          <View style={styles.options}>
            <TouchableOpacity
              style={styles.remember}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <Text style={styles.optionText}>Ingat Saya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => alert("Fitur lupa kata sandi belum dibuat.")}
            >
              <Text style={styles.link}>Lupa Kata Sandi?</Text>
            </TouchableOpacity>
          </View>

          {/* Tombol masuk */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Masuk →</Text>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>atau masuk dengan</Text>
            <View style={styles.line} />
          </View>

          {/* Login SSO */}
          <TouchableOpacity
            style={styles.ssoButton}
            onPress={() => alert("Login SSO belum diintegrasikan.")}
          >
            <Text style={styles.ssoText}>◇ Masuk dengan Akun Kampus (SSO)</Text>
          </TouchableOpacity>
        </View>

        {/* Informasi sinkronisasi */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>▣</Text>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sinkronisasi Jadwal Otomatis</Text>

            <Text style={styles.infoDescription}>
              Terhubung dengan SIAK dan Google Classroom
            </Text>
          </View>
        </View>

        {/* Navigasi registrasi */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Belum punya akun? </Text>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            activeOpacity={0.7}
            style={styles.registerButton}
          >
            <Text style={styles.link}>Daftar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },

  header: {
    alignItems: "center",
    paddingBottom: 22,
  },

  logo: {
    width: 54,
    height: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 3,
  },

  logoText: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#073B82",
  },

  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#102A36",
    textAlign: "center",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    color: "#475467",
    textAlign: "center",
    lineHeight: 21,
  },

  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 21,
    elevation: 3,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#102A36",
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    height: 46,
    backgroundColor: "#F1F7FC",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#102A36",
    marginBottom: 17,
  },

  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 1,
    marginBottom: 23,
  },

  remember: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    backgroundColor: "#D9EDFC",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  checked: {
    backgroundColor: "#073B82",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  optionText: {
    fontSize: 12,
    color: "#344054",
  },

  link: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0645A5",
  },

  loginButton: {
    height: 45,
    backgroundColor: "#073B82",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 19,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#D7E5F2",
  },

  separatorText: {
    fontSize: 11,
    color: "#667085",
    marginHorizontal: 10,
  },

  ssoButton: {
    minHeight: 44,
    backgroundColor: "#E5F4FF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  ssoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0645A5",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F2FC",
    borderRadius: 13,
    padding: 13,
    marginTop: 15,
  },

  infoIcon: {
    fontSize: 23,
    color: "#0645A5",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#102A36",
    marginBottom: 3,
  },

  infoDescription: {
    fontSize: 10,
    color: "#475467",
    lineHeight: 15,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  registerText: {
    fontSize: 13,
    color: "#475467",
  },
});
