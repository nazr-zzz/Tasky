import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { fetchClassMembers, updateMemberRole } from "../services/api";

// Samakan nilai peran dari server menjadi 3 jenis peran yang dipakai tampilan
function normalisasiPeran(peran) {
  const p = String(peran || "");
  if (p.includes("Pendamping")) return "PJMK Pendamping";
  if (p.includes("PJMK") || p.toLowerCase().includes("admin")) return "PJMK Utama";
  return "Mahasiswa";
}

function ambilInisial(nama) {
  const bagian = String(nama || "?").trim().split(/\s+/);
  const huruf = bagian.slice(0, 2).map((b) => b.charAt(0).toUpperCase());
  return huruf.join("") || "?";
}

function mapMember(m, currentUserId) {
  const id = m.USER_ID ?? m.user_id ?? m.id;
  const role = normalisasiPeran(m.PERAN ?? m.peran ?? m.ROLE ?? m.role);
  const name = m.NAMA ?? m.nama ?? "-";
  return {
    id,
    name,
    nim: m.NIM ?? m.nim ?? "-",
    role,
    isSelf: String(id) === String(currentUserId),
    initials: ambilInisial(name),
    subText:
      role === "PJMK Pendamping"
        ? "Dapat menambah & mengubah tugas kuliah"
        : undefined,
  };
}

export default function AnggotaKelasScreen({ kelas, currentUser, onBack }) {
  const kelasId = kelas?.kelas_id;
  const kodeKelas = kelas?.code || kelas?.kode_kelas || "-";
  const namaKelas = kelas?.name || kelas?.nama_kelas || "Kelas";

  // Hanya PJMK Utama yang boleh mengangkat PJMK Pendamping
  const isPJMKUtama =
    !!kelas?.isPjmk && !String(kelas?.role || "").includes("Pendamping");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promotingId, setPromotingId] = useState(null);

  const loadMembers = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchClassMembers(kelasId);
      const list = Array.isArray(data) ? data : [];
      setMembers(list.map((m) => mapMember(m, currentUser?.userId)));
    } catch (e) {
      setError(e?.message || "Gagal memuat anggota kelas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kelasId) {
      setError("Data kelas tidak ditemukan.");
      setLoading(false);
      return;
    }
    loadMembers();
  }, [kelasId]);

  const handlePromote = (member) => {
    Alert.alert(
      "Angkat PJMK Pendamping",
      `Apakah Anda yakin ingin mengangkat "${member.name}" sebagai PJMK Pendamping kelas ini? Dia akan memiliki hak untuk menambah dan mengubah tugas kuliah.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Angkat Sekarang",
          onPress: async () => {
            setPromotingId(member.id);
            try {
              // Kirim ke server dulu, ubah tampilan hanya jika berhasil
              await updateMemberRole(kelasId, member.id, "PJMK Pendamping");
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === member.id
                    ? {
                        ...m,
                        role: "PJMK Pendamping",
                        subText: "Dapat menambah & mengubah tugas kuliah",
                      }
                    : m
                )
              );
              Alert.alert(
                "Sukses! 👑",
                `${member.name} sekarang aktif sebagai PJMK Pendamping.`
              );
            } catch (e) {
              Alert.alert(
                "Gagal Mengubah Peran",
                e?.message || "Tidak dapat terhubung ke server."
              );
            } finally {
              setPromotingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = async () => {
    if (!kodeKelas || kodeKelas === "-") return;
    try {
      await Clipboard.setStringAsync(String(kodeKelas));
      Alert.alert("Disalin! 📋", `Kode kelas "${kodeKelas}" telah disalin.`);
    } catch (e) {
      Alert.alert("Gagal", "Kode kelas tidak dapat disalin.");
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
        <Text style={styles.headerTitle}>Anggota Kelas</Text>
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
        {/* CLASS INFO BOX */}
        <View style={styles.classInfoBox}>
          <View style={styles.semesterRow}>
            <Text style={styles.semesterTag}>🎓 INFORMASI KELAS</Text>
            <View style={styles.miniGroupIconBox}>
              <Text style={styles.miniGroupIcon}>👥</Text>
            </View>
          </View>

          <Text style={styles.classTitle}>{namaKelas}</Text>
          <Text style={styles.classSub}>
            {loading ? "Memuat anggota..." : `${members.length} Anggota Terdaftar`}
          </Text>

          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>
              Kode Kelas: <Text style={styles.codeValue}>{kodeKelas}</Text>
            </Text>
            <TouchableOpacity style={styles.copyPill} onPress={handleCopyCode}>
              <Text style={styles.copyPillText}>📋 Salin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER KEWENANGAN PJMK UTAMA */}
        {isPJMKUtama && (
          <View style={styles.pjmkBanner}>
            <View style={styles.pjmkIconBox}>
              <Text style={styles.pjmkIcon}>🛡️</Text>
            </View>
            <View style={styles.pjmkContent}>
              <Text style={styles.pjmkTitle}>Kewenangan PJMK Utama</Text>
              <Text style={styles.pjmkDesc}>
                Sebagai PJMK Utama, Anda dapat mengangkat anggota menjadi PJMK
                Pendamping / Wakil PJMK untuk membantu mengelola tugas dan agenda
                kuliah.
              </Text>
            </View>
          </View>
        )}

        {/* SECTION DAFTAR ANGGOTA */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Daftar Anggota ({members.length})
          </Text>
        </View>

        {/* STATUS: MEMUAT / ERROR / KOSONG / DAFTAR */}
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#073B82" />
            <Text style={styles.stateText}>Memuat anggota dari server...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Gagal Memuat Anggota</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMembers}>
              <Text style={styles.retryBtnText}>🔄 Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Belum ada anggota di kelas ini.</Text>
          </View>
        ) : (
          members.map((member) => (
            <View
              key={member.id}
              style={[styles.memberCard, member.isSelf && styles.memberCardSelf]}
            >
              <View style={styles.memberTopRow}>
                <View
                  style={[
                    styles.memberAvatar,
                    member.role !== "Mahasiswa" ? styles.avatarPJMK : styles.avatarMhs,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitials,
                      member.role !== "Mahasiswa"
                        ? styles.initialsPJMK
                        : styles.initialsMhs,
                    ]}
                  >
                    {member.initials}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>
                      {member.name}{" "}
                      {member.isSelf ? (
                        <Text style={styles.selfLabel}>Anda</Text>
                      ) : null}
                    </Text>
                    <View
                      style={[
                        styles.roleBadge,
                        member.role === "PJMK Utama"
                          ? styles.badgeUtama
                          : member.role === "PJMK Pendamping"
                          ? styles.badgePendamping
                          : styles.badgeMhs,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          member.role === "PJMK Utama"
                            ? styles.textUtama
                            : member.role === "PJMK Pendamping"
                            ? styles.textPendamping
                            : styles.textMhs,
                        ]}
                      >
                        {member.role === "PJMK Utama"
                          ? "👑 "
                          : member.role === "PJMK Pendamping"
                          ? "👥 "
                          : ""}
                        {member.role}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.nimText}>NIM {member.nim}</Text>

                  {member.role === "PJMK Utama" && (
                    <View style={styles.statusPillsRow}>
                      <Text style={styles.activeStatusText}>
                        🟢 Penanggung Jawab Kelas
                      </Text>
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessText}>Akses Penuh</Text>
                      </View>
                    </View>
                  )}

                  {member.subText ? (
                    <Text style={styles.subText}>{member.subText}</Text>
                  ) : null}

                  {/* TOMBOL JADIKAN PJMK PENDAMPING (HANYA UNTUK PJMK UTAMA) */}
                  {isPJMKUtama && member.role === "Mahasiswa" && !member.isSelf && (
                    <TouchableOpacity
                      style={[
                        styles.promoteBtn,
                        promotingId === member.id && styles.promoteBtnDisabled,
                      ]}
                      onPress={() => handlePromote(member)}
                      disabled={promotingId === member.id}
                      activeOpacity={0.8}
                    >
                      {promotingId === member.id ? (
                        <ActivityIndicator size="small" color="#1D4ED8" />
                      ) : (
                        <Text style={styles.promoteBtnText}>
                          👥+ Jadikan PJMK Pendamping
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
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
    paddingTop: 14,
    paddingBottom: 40,
  },
  classInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  semesterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  semesterTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  miniGroupIconBox: {
    backgroundColor: "#EFF6FF",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniGroupIcon: {
    fontSize: 14,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#102A36",
    marginBottom: 2,
  },
  classSub: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  codeLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  codeValue: {
    fontWeight: "800",
    color: "#073B82",
  },
  copyPill: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyPillText: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "700",
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
    width: 36,
    height: 36,
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
    fontSize: 12,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 2,
  },
  pjmkDesc: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },
  stateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B91C1C",
  },
  errorDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#073B82",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  memberCardSelf: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FBFDFF",
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarPJMK: {
    backgroundColor: "#E0EDFE",
  },
  avatarMhs: {
    backgroundColor: "#F1F5F9",
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: "900",
  },
  initialsPJMK: {
    color: "#073B82",
  },
  initialsMhs: {
    color: "#64748B",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
  },
  selfLabel: {
    fontSize: 11,
    color: "#073B82",
    fontWeight: "600",
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeUtama: {
    backgroundColor: "#EFF6FF",
  },
  badgePendamping: {
    backgroundColor: "#F3E8FF",
  },
  badgeMhs: {
    backgroundColor: "#F1F5F9",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  textUtama: {
    color: "#1D4ED8",
  },
  textPendamping: {
    color: "#7E22CE",
  },
  textMhs: {
    color: "#64748B",
  },
  nimText: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
  },
  statusPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  activeStatusText: {
    fontSize: 10,
    color: "#166534",
    fontWeight: "600",
  },
  accessBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  accessText: {
    fontSize: 9,
    color: "#475467",
    fontWeight: "600",
  },
  subText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    fontStyle: "italic",
  },
  promoteBtn: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    minWidth: 60,
    alignItems: "center",
  },
  promoteBtnDisabled: {
    opacity: 0.6,
  },
  promoteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});