import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  getBaseUrl,
  setCustomBaseUrl,
  CURRENT_LAN_IP,
  BACKEND_PORT,
} from "../services/api";

export default function ProfilScreen({
  currentUser,
  tasksCount = { finished: 1, unfinished: 3, totalClasses: 2 },
}) {
  const [ipInput, setIpInput] = useState(CURRENT_LAN_IP);
  const [testing, setTesting] = useState(false);
  const [serverUrl, setServerUrl] = useState(getBaseUrl());

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const cleanIp = ipInput.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      const targetUrl = `http://${cleanIp}:${BACKEND_PORT}`;
      const res = await fetch(`${targetUrl}/`, { method: "GET" });
      if (res.ok) {
        setCustomBaseUrl(targetUrl);
        setServerUrl(targetUrl);
        Alert.alert(
          "Koneksi Berhasil! 🟢",
          `Server aktif di: ${targetUrl}\nExpo Go dan web browser siap sinkronisasi.`
        );
      } else {
        Alert.alert("Server Merespons dengan Kode Error", `Status: ${res.status}`);
      }
    } catch (e) {
      Alert.alert(
        "Koneksi Gagal 🔴",
        `Tidak dapat menghubungi http://${ipInput}:${BACKEND_PORT}.\nPastikan server backend dinyalakan dengan 'npm run dev' di folder Tasky/backend.`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi Keluar", "Apakah Anda yakin ingin keluar dari akun?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  const total = tasksCount.finished + tasksCount.unfinished;
  const progressPercent =
    total > 0 ? Math.round((tasksCount.finished / total) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* KARTU IDENTITAS PENGGUNA */}
      <View style={styles.userCard}>
        <View style={styles.avatarBig}>
          <Text style={styles.avatarBigText}>
            {(currentUser?.nama || "M").charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.userName}>{currentUser?.nama || "Nazril Ilham"}</Text>
        <Text style={styles.userNim}>NIM: {currentUser?.nim || "2106728192"}</Text>
        <Text style={styles.userEmail}>{currentUser?.email || "nazril@student.ac.id"}</Text>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>★ Mahasiswa Aktif & PJMK Kelas</Text>
        </View>
      </View>

      {/* STATISTIK TUGAS (SRS US-11) */}
      <Text style={styles.sectionTitle}>Statistik Pengerjaan Tugas (US-11)</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: "#12B76A" }]}>
            {tasksCount.finished}
          </Text>
          <Text style={styles.statLabel}>Tugas Selesai</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: "#F79009" }]}>
            {tasksCount.unfinished}
          </Text>
          <Text style={styles.statLabel}>Belum Dikerjakan</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: "#073B82" }]}>
            {tasksCount.totalClasses}
          </Text>
          <Text style={styles.statLabel}>Kelas Diikuti</Text>
        </View>
      </View>

      {/* PROGRES BAR BELAJAR */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tingkat Penyelesaian Semester</Text>
          <Text style={styles.progressPercentText}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* PENGATURAN KONEKSI MULTI-DEVICE */}
      <Text style={styles.sectionTitle}>Konektivitas Jaringan (Android / iOS / Web)</Text>
      <View style={styles.configCard}>
        <Text style={styles.configSubtitle}>
          Agar perangkat lain (Expo Go di HP teman, Android emulator, atau iOS) bisa terhubung secara bersamaan:
        </Text>

        <Text style={styles.currentUrlText}>
          URL Aktif: <Text style={styles.boldText}>{serverUrl}</Text>
        </Text>

        <Text style={styles.inputLabel}>IP Komputer Laptop (Wi-Fi):</Text>
        <View style={styles.ipRow}>
          <TextInput
            style={styles.ipInput}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="192.168.100.81"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.testBtnText}>Uji & Simpan</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* TOMBOL LOGOUT */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutBtnText}>🚪 Keluar dari Akun</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarBig: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#BAE0FD",
  },
  avatarBigText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0369A1",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 2,
  },
  userNim: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 12,
  },
  badgePill: {
    backgroundColor: "#FEF0C7",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B54708",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 10,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#073B82",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#12B76A",
    borderRadius: 4,
  },
  configCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  configSubtitle: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 10,
  },
  currentUrlText: {
    fontSize: 12,
    color: "#102A36",
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "800",
    color: "#073B82",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
  },
  ipRow: {
    flexDirection: "row",
    gap: 8,
  },
  ipInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#102A36",
    backgroundColor: "#F8FAFC",
  },
  testBtn: {
    backgroundColor: "#073B82",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  testBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#FEE4E2",
    borderRadius: 14,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECDCA",
  },
  logoutBtnText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "700",
  },
});
