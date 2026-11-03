import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  Clipboard,
} from "react-native";
import { updateMemberRole } from "../services/api";

export default function AnggotaKelasScreen({
  kelas,
  currentUser,
  onBack,
}) {
  const currentClass = kelas || {
    name: "Teknik Informatika 2021",
    sub: "Reguler A • 48 Mahasiswa Terdaftar",
    code: "TI21-A89K",
  };

  const isPJMK =
    currentUser?.role?.includes("PJMK") ||
    currentUser?.email?.includes("pjmk") ||
    currentUser?.nama?.includes("Dimas");

  const [members, setMembers] = useState([
    {
      id: "u_dimas",
      name: "Dimas Pratama",
      isSelf: true,
      nim: "2108561042",
      role: "PJMK Utama",
      statusText: "Status: Aktif sebagai Penanggung Jawab",
      accessText: "Akses Penuh",
      initials: "DP",
    },
    {
      id: "u_anindya",
      name: "Anindya Putri M",
      isSelf: false,
      nim: "2108561015",
      role: "PJMK Pendamping",
      subText: "Dapat menambah & mengubah tugas kuliah",
      initials: "AP",
    },
    {
      id: "u_bagus",
      name: "Bagus Wicaksono",
      isSelf: false,
      nim: "2108561029",
      role: "Mahasiswa",
      initials: "BW",
    },
    {
      id: "u_citra",
      name: "Citra Dewi Lestari",
      isSelf: false,
      nim: "2108561033",
      role: "Mahasiswa",
      initials: "CD",
    },
    {
      id: "u_fajar",
      name: "Fajar Nugraha",
      isSelf: false,
      nim: "2108561049",
      role: "Mahasiswa",
      initials: "FN",
    },
  ]);

  const handlePromote = async (member) => {
    Alert.alert(
      "Angkat PJMK Pendamping",
      `Apakah Anda yakin ingin mengangkat "${member.name}" sebagai PJMK Pendamping kelas ini? Dia akan memiliki hak untuk menambah dan mengubah tugas kuliah.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Angkat Sekarang",
          onPress: async () => {
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

            try {
              await updateMemberRole(
                currentClass.kelas_id || "k_ti21",
                member.id,
                "PJMK Pendamping"
              );
            } catch (e) {
              // Tersimpan lokal
            }

            Alert.alert("Sukses! 👑", `${member.name} sekarang aktif sebagai PJMK Pendamping.`);
          },
        },
      ]
    );
  };

  const handleCopyCode = () => {
    const code = currentClass.code || currentClass.kode_kelas || "TI21-A89K";
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(code);
    }
    Alert.alert("Disalin! 📋", `Kode kelas "${code}" telah disalin.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER ATAS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tugas</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser?.nama || "D").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* STRIP OFFLINE */}
        <View style={styles.offlineStrip}>
          <Text style={styles.offlineStripText}>
            ⚠️ Sinkronisasi offline aktif • Tersimpan lokal 🟢
          </Text>
        </View>

        {/* CLASS INFO BOX */}
        <View style={styles.classInfoBox}>
          <View style={styles.semesterRow}>
            <Text style={styles.semesterTag}>🎓 SEMESTER GANJIL 2024/2025</Text>
            <View style={styles.miniGroupIconBox}>
              <Text style={styles.miniGroupIcon}>👥</Text>
            </View>
          </View>

          <Text style={styles.classTitle}>
            {currentClass.name || "Teknik Informatika 2021"}
          </Text>
          <Text style={styles.classSub}>
            {currentClass.sub || "Reguler A • 48 Mahasiswa Terdaftar"}
          </Text>

          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>
              Kode Kelas:{" "}
              <Text style={styles.codeValue}>
                {currentClass.code || currentClass.kode_kelas || "TI21-A89K"}
              </Text>
            </Text>
            <TouchableOpacity style={styles.copyPill} onPress={handleCopyCode}>
              <Text style={styles.copyPillText}>📋 Salin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER KEWENANGAN PJMK UTAMA */}
        {isPJMK && (
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
            Daftar Anggota ({members.length} Ditampilkan)
          </Text>
          <Text style={styles.filterText}>Semua</Text>
        </View>

        {/* LIST MEMBERS */}
        {members.map((member) => (
          <View
            key={member.id}
            style={[
              styles.memberCard,
              member.isSelf && styles.memberCardSelf,
            ]}
          >
            <View style={styles.memberTopRow}>
              <View
                style={[
                  styles.memberAvatar,
                  member.isSelf ? styles.avatarPJMK : styles.avatarMhs,
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    member.isSelf ? styles.initialsPJMK : styles.initialsMhs,
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
                      {member.role === "PJMK Utama" ? "👑 " : member.role === "PJMK Pendamping" ? "👥 " : ""}
                      {member.role}
                    </Text>
                  </View>
                </View>

                <Text style={styles.nimText}>NIM {member.nim}</Text>

                {member.statusText && (
                  <View style={styles.statusPillsRow}>
                    <Text style={styles.activeStatusText}>
                      🟢 {member.statusText}
                    </Text>
                    {member.accessText && (
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessText}>{member.accessText}</Text>
                      </View>
                    )}
                  </View>
                )}

                {member.subText && (
                  <Text style={styles.subText}>{member.subText}</Text>
                )}

                {/* TOMBOL JADIKAN PJMK PENDAMPING (KHUSUS MAHASISWA & JIKA USER ADALAH PJMK) */}
                {isPJMK && member.role === "Mahasiswa" && (
                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={() => handlePromote(member)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.promoteBtnText}>
                      👥+ Jadikan PJMK Pendamping
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* FOOTER NOTE */}
        <View style={styles.footerNoteBox}>
          <Text style={styles.footerNoteText}>
            ⓘ Daftar mahasiswa diperbarui otomatis via SIAKAD. Fitur pesan
            pribadi sengaja dinonaktifkan demi fokus akademik.
          </Text>
        </View>

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
    paddingTop: 12,
    paddingBottom: 40,
  },
  offlineStrip: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineStripText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
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
  filterText: {
    fontSize: 11,
    color: "#64748B",
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
  },
  promoteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  footerNoteBox: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
});
