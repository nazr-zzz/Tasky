import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import {
  fetchClassMembers,
  updateMemberRole,
  copotPendamping,
} from "../services/api";

// [REVISI 6] false = jarak atas (jam / status bar) sudah ditangani dashboard.
// Ubah jadi true HANYA jika di dashboard.tsx TAMBAH_SAFE_AREA_SUBLAYAR diubah jadi false.
const SAFE_AREA_SENDIRI = false;

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

export default function AnggotaKelasScreen({
  kelas,
  currentUser,
  onBack,
  onChanged,
}) {
  const insets = useSafeAreaInsets();

  const kelasId = kelas?.kelas_id;
  const kodeKelas = kelas?.code || kelas?.kode_kelas || "-";
  const namaKelas = kelas?.name || kelas?.nama_kelas || "Kelas";

  // [REVISI 5] Hanya PJMK Utama yang boleh mengangkat / mencopot PJMK Pendamping.
  // kelas.isUtama datang dari dashboard (mapClass); logika lama dipakai sebagai cadangan.
  const isPJMKUtama =
    kelas?.isUtama !== undefined
      ? !!kelas.isUtama
      : !!kelas?.isPjmk && !String(kelas?.role || "").includes("Pendamping");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // id anggota yang sedang diproses (angkat / copot), untuk menonaktifkan tombolnya
  const [busyId, setBusyId] = useState(null);

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

  // ---------------------------------------------------------------
  // ANGKAT jadi PJMK Pendamping
  // [REVISI 9] Maksimal 2 PJMK per mata kuliah (1 Utama + 1 Pendamping).
  // ---------------------------------------------------------------
  const totalPjmk = members.filter(
    (m) => m.role === "PJMK Utama" || m.role === "PJMK Pendamping"
  ).length;
  const isPjmkFull = totalPjmk >= 2;

  const handlePromote = (member) => {
    if (isPjmkFull) {
      Alert.alert(
        "Kuota PJMK Penuh",
        "Mata kuliah ini sudah memiliki 2 PJMK (1 PJMK Utama dan 1 PJMK Pendamping). Tidak dapat menambah PJMK Pendamping lagi."
      );
      return;
    }

    Alert.alert(
      "Angkat PJMK Pendamping",
      `Apakah Anda yakin ingin mengangkat "${member.name}" sebagai PJMK Pendamping kelas ini? Dia akan memiliki hak untuk menambah dan mengubah tugas kuliah.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Angkat Sekarang",
          onPress: async () => {
            setBusyId(member.id);
            try {
              // argumen ke-4 = id PJMK Utama yang sedang login (wajib di backend)
              await updateMemberRole(
                kelasId,
                member.id,
                "PJMK Pendamping",
                currentUser?.userId
              );
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
              if (onChanged) onChanged();
              Alert.alert(
                "Sukses",
                `${member.name} sekarang aktif sebagai PJMK Pendamping.`
              );
            } catch (e) {
              Alert.alert(
                "Gagal Mengubah Peran",
                e?.message || "Tidak dapat terhubung ke server."
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------
  // [REVISI 5] COPOT akses PJMK Pendamping -> kembali jadi Mahasiswa
  // ---------------------------------------------------------------
  const handleCopot = (member) => {
    Alert.alert(
      "Copot PJMK Pendamping",
      `Copot akses PJMK Pendamping dari "${member.name}"? Perannya akan kembali menjadi Mahasiswa dan tidak bisa lagi menambah atau mengubah tugas kuliah.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Copot Akses",
          style: "destructive",
          onPress: async () => {
            setBusyId(member.id);
            try {
              await copotPendamping(kelasId, member.id, currentUser?.userId);
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === member.id
                    ? { ...m, role: "Mahasiswa", subText: undefined }
                    : m
                )
              );
              if (onChanged) onChanged();
              Alert.alert(
                "Berhasil",
                `Akses PJMK Pendamping ${member.name} telah dicopot.`
              );
            } catch (e) {
              Alert.alert(
                "Gagal Mencopot Akses",
                e?.message || "Tidak dapat terhubung ke server."
              );
            } finally {
              setBusyId(null);
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
      Alert.alert("Disalin", `Kode kelas "${kodeKelas}" telah disalin.`);
    } catch (e) {
      Alert.alert("Gagal", "Kode kelas tidak dapat disalin.");
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        SAFE_AREA_SENDIRI ? { paddingTop: insets.top } : null,
      ]}
    >
      {/* HEADER ATAS */}
      <View style={styles.header}>
        {/* [REVISI 4] Tombol Kembali besar, mudah ditekan */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Anggota Kelas</Text>

        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(currentUser?.nama || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* CLASS INFO BOX */}
        <View style={styles.classInfoBox}>
          <View style={styles.semesterRow}>
            <Text style={styles.semesterTag}>INFORMASI KELAS</Text>
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
              <Text style={styles.copyPillText}>Salin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER KEWENANGAN PJMK UTAMA */}
        {isPJMKUtama && (
          <View style={styles.pjmkBanner}>
            <View style={styles.pjmkContent}>
              <Text style={styles.pjmkTitle}>Kewenangan PJMK Utama</Text>
              <Text style={styles.pjmkDesc}>
                Sebagai PJMK Utama, Anda dapat mengangkat anggota menjadi PJMK
                Pendamping untuk membantu mengelola tugas kuliah, dan dapat
                mencopot aksesnya kapan saja. Maksimal PJMK per mata kuliah adalah 2 orang.
              </Text>
            </View>
          </View>
        )}

        {/* REVISI 9: BANNER KUOTA PJMK JIKA SUDAH PENUH (2/2) */}
        {isPJMKUtama && isPjmkFull && (
          <View style={styles.fullQuotaBanner}>
            <Text style={styles.fullQuotaTitle}>Kuota PJMK Penuh (2/2)</Text>
            <Text style={styles.fullQuotaDesc}>
              Mata kuliah ini sudah memiliki 1 PJMK Utama dan 1 PJMK Pendamping. Mahasiswa lain tidak dapat dijadikan PJMK Pendamping kecuali akses pendamping yang ada dicopot terlebih dahulu.
            </Text>
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
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
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
                        {member.role}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.nimText}>NIM {member.nim}</Text>

                  {member.role === "PJMK Utama" && (
                    <View style={styles.statusPillsRow}>
                      <Text style={styles.activeStatusText}>
                        Penanggung Jawab Kelas
                      </Text>
                      <View style={styles.accessBadge}>
                        <Text style={styles.accessText}>Akses Penuh</Text>
                      </View>
                    </View>
                  )}

                  {member.subText ? (
                    <Text style={styles.subText}>{member.subText}</Text>
                  ) : null}

                  {/* TOMBOL JADIKAN PJMK PENDAMPING (HANYA JIKA KUOTA BELUM PENUH) */}
                  {isPJMKUtama && member.role === "Mahasiswa" && !member.isSelf && !isPjmkFull && (
                    <TouchableOpacity
                      style={[
                        styles.promoteBtn,
                        busyId === member.id && styles.btnDisabled,
                      ]}
                      onPress={() => handlePromote(member)}
                      disabled={busyId === member.id}
                      activeOpacity={0.8}
                    >
                      {busyId === member.id ? (
                        <ActivityIndicator size="small" color="#1D4ED8" />
                      ) : (
                        <Text style={styles.promoteBtnText}>
                          + Jadikan PJMK Pendamping
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* [REVISI 5] TOMBOL COPOT PJMK PENDAMPING (HANYA UNTUK PJMK UTAMA) */}
                  {isPJMKUtama && member.role === "PJMK Pendamping" && !member.isSelf && (
                    <TouchableOpacity
                      style={[
                        styles.copotBtn,
                        busyId === member.id && styles.btnDisabled,
                      ]}
                      onPress={() => handleCopot(member)}
                      disabled={busyId === member.id}
                      activeOpacity={0.8}
                    >
                      {busyId === member.id ? (
                        <ActivityIndicator size="small" color="#B91C1C" />
                      ) : (
                        <Text style={styles.copotBtnText}>
                          Copot Akses Pendamping
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
    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  // [REVISI 4] area sentuh besar (minimal 44)
  backBtn: {
    width: 100,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 8,
  },
  backIcon: {
    fontSize: 22,
    color: "#102A36",
    fontWeight: "bold",
    marginRight: 4,
  },
  backText: {
    fontSize: 14,
    color: "#102A36",
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#102A36",
  },
  headerRight: {
    width: 100,
    alignItems: "flex-end",
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
  fullQuotaBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FCD34D",
    marginBottom: 16,
  },
  fullQuotaTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 4,
  },
  fullQuotaDesc: {
    fontSize: 11,
    color: "#B45309",
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    minWidth: 60,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  promoteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  // [REVISI 5] tombol Copot (merah)
  copotBtn: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    minWidth: 60,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  copotBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});