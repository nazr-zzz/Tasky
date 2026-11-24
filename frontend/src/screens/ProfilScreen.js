import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value && value.length > 0 ? value : "-"}</Text>
  </View>
);

export default function ProfilScreen({
  currentUser,
  serverStatus,
  ipValue,
  onChangeIp,
  onSaveIp,
  checking,
  backendPort,
  onLogout,
  bottomSpace = 90,
}) {
  const initial = (currentUser?.nama || "?").charAt(0).toUpperCase();

  const confirmLogout = () => {
    Alert.alert("Keluar", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: onLogout },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomSpace + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{currentUser?.nama || "-"}</Text>
        <Text style={styles.roleText}>{currentUser?.role}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Nama" value={currentUser?.nama} />
        <Row label="NIM" value={currentUser?.nim} />
        <Row label="Email" value={currentUser?.email} />
        <Row
          label="Semester"
          value={currentUser?.semester ? `Semester ${currentUser.semester}` : ""}
        />
        <Row label="Role" value={currentUser?.role} />
      </View>

      <Text style={styles.sectionTitle}>Koneksi Server</Text>
      <View style={styles.card}>
        <Text style={styles.value}>{serverStatus}</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>
          IP LAN Backend (Port {String(backendPort)})
        </Text>
        <TextInput
          style={styles.input}
          value={ipValue}
          onChangeText={onChangeIp}
          placeholder="Contoh: 192.168.1.10"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSaveIp}
          disabled={checking}
        >
          <Text style={styles.saveBtnText}>
            {checking ? "Mengecek..." : "Simpan & Tes Koneksi"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8FC" },
  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EBF3FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#0B4A9E" },
  name: { fontSize: 18, fontWeight: "700", color: "#0F2A38" },
  roleText: { fontSize: 13, color: "#64748B", marginTop: 2 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 16,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  label: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 2 },
  value: { fontSize: 14, color: "#0F2A38" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F2A38",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F2A38",
    marginTop: 6,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#0B4A9E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
});