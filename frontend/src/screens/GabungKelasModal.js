import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { joinClass } from "../services/api";

export default function GabungKelasScreen({
  currentUser,
  onBack,
  onClassJoined,
}) {
  const [kodeKelas, setKodeKelas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGabung = async () => {
    if (!kodeKelas.trim()) {
      Alert.alert("Perhatian", "Masukkan kode kelas (contoh: TI21-A89K).");
      return;
    }

    if (!currentUser?.userId) {
      Alert.alert("Sesi Berakhir", "Silakan login ulang.");
      return;
    }

    setLoading(true);
    try {
      const kode = kodeKelas.trim().toUpperCase();
      const res = await joinClass(kode, currentUser.userId);

      const targetClass = res?.kelas || { kode_kelas: kode };
      const namaKelas = targetClass.nama_kelas ?? targetClass.NAMA_KELAS ?? targetClass.name;

      Alert.alert(
        "Berhasil Bergabung! 🎉",
        namaKelas
          ? `Selamat! Anda telah resmi bergabung ke kelas "${namaKelas}".`
          : "Selamat! Anda telah resmi bergabung ke kelas."
      );
      if (onClassJoined) await onClassJoined(targetClass);
      if (onBack) onBack();
    } catch (e) {
      Alert.alert(
        "Gagal Bergabung",
        e?.message || "Kode kelas tidak valid atau server tidak dapat dihubungi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gabung Kelas</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ILUSTRASI ICON GABUNG KELAS */}
        <View style={styles.heroSection}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroIcon}>👥</Text>
            <View style={styles.heroMiniBadge}>
              <Text style={styles.heroMiniIcon}>🎓</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Masukkan Kode Kelas</Text>
          <Text style={styles.heroSubtitle}>
            Minta 6-8 digit kode kelas unik dari PJMK (Penanggung Jawab Mata
            Kuliah) Anda untuk mengakses seluruh daftar tugas kelas.
          </Text>
        </View>

        {/* INPUT KODE KELAS */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>KODE KELAS</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>🔑</Text>
            <TextInput
              style={styles.textInput}
              placeholder="MISAL: TI21-A89K"
              placeholderTextColor="#94A3B8"
              value={kodeKelas}
              onChangeText={(text) => setKodeKelas(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          <View style={styles.counterRow}>
            <Text style={styles.counterHint}>ⓘ Format kode 6-8 karakter</Text>
            <Text style={styles.counterText}>{kodeKelas.length}/10</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.joinBtn,
              !kodeKelas.trim() ? styles.joinBtnDisabled : styles.joinBtnActive,
            ]}
            onPress={handleGabung}
            disabled={loading || !kodeKelas.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.joinBtnText,
                  !kodeKelas.trim() && styles.joinBtnTextDisabled,
                ]}
              >
                👥 Gabung
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* FEATURE CARD: TERSINKRONISASI OTOMATIS */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconBox}>
            <Text style={styles.featureIcon}>✨</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Tersinkronisasi Otomatis</Text>
            <Text style={styles.featureDesc}>
              Setelah bergabung, Anda akan otomatis menerima semua jadwal tugas
              kuliah yang dicatat oleh PJMK dan dapat memantau status pengerjaan
              pribadi Anda.
            </Text>
          </View>
        </View>

        {/* LINK BANTUAN */}
        <TouchableOpacity
          style={styles.helpLink}
          onPress={() =>
            Alert.alert(
              "Kontak PJMK",
              "Hubungi ketua kelas / PJMK mata kuliah Anda di grup WhatsApp kelas untuk mendapatkan kode gabung (misal: TI21-A89K)."
            )
          }
        >
          <Text style={styles.helpLinkText}>
            ❓ Belum mendapatkan kode?{" "}
            <Text style={styles.helpLinkBold}>Hubungi PJMK</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0EDFE",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 14,
  },
  heroIcon: {
    fontSize: 34,
  },
  heroMiniBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#073B82",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroMiniIcon: {
    fontSize: 13,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#102A36",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 6,
  },
  inputPrefix: {
    fontSize: 15,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
    letterSpacing: 1.5,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  counterHint: {
    fontSize: 11,
    color: "#64748B",
  },
  counterText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  joinBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnActive: {
    backgroundColor: "#073B82",
  },
  joinBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  joinBtnTextDisabled: {
    color: "#94A3B8",
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  featureIconBox: {
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
    color: "#64748B",
    lineHeight: 16,
  },
  helpLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  helpLinkText: {
    fontSize: 12,
    color: "#64748B",
  },
  helpLinkBold: {
    color: "#073B82",
    fontWeight: "700",
  },
});