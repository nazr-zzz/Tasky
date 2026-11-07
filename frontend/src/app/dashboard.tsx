import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

// Sub-komponen sesuai UI/UX Figma dan SRS
import DaftarTugasKelasScreen from "../screens/DaftarTugasKelasScreen";
import DetailTugasScreen from "../screens/DetailTugasScreen";
import AnggotaKelasScreen from "../screens/AnggotaKelasScreen";
import BuatKelasScreen from "../screens/BuatKelasModal";
import GabungKelasScreen from "../screens/GabungKelasModal";
import FormTugasScreen from "../screens/FormTugasModal";
import UbahDeadlineModal from "../screens/UbahDeadlineModal";
import CatatanScreen from "../screens/CatatanScreen";
import NotifikasiScreen from "../screens/NotifikasiScreen";

import {
  fetchTasks,
  updateTaskStatus,
  deleteTask,
  fetchClasses,
  checkServerConnection,
  setCustomBaseUrl,
  CURRENT_LAN_IP,
  BACKEND_PORT,
} from "../services/api";

const DaftarTugasKelasComp: any = DaftarTugasKelasScreen;
const DetailTugasComp: any = DetailTugasScreen;
const AnggotaKelasComp: any = AnggotaKelasScreen;
const BuatKelasComp: any = BuatKelasScreen;
const GabungKelasComp: any = GabungKelasScreen;
const FormTugasComp: any = FormTugasScreen;
const UbahDeadlineComp: any = UbahDeadlineModal;
const CatatanComp: any = CatatanScreen;
const NotifikasiComp: any = NotifikasiScreen;

// Warna Tema Desain Baru
const COLORS = {
  background: "#F5F8FC",
  cardBg: "#FFFFFF",
  primaryBlue: "#0B4A9E",
  lightBlueCard: "#EBF3FC",
  navyText: "#0F2A38",
  subText: "#64748B",
  border: "#E2E8F0",
  orangeBadge: "#FEF3C7",
  orangeText: "#B45309",
  urgentBadge: "#FEE2E2",
  urgentText: "#DC2626",
  purpleBadge: "#F3E8FF",
  purpleText: "#7E22CE",
  greenStatus: "#10B981",
};

// =========================================================================
// HELPER: pemetaan data dari server (tanpa data dummy)
// =========================================================================

// Ambil nilai string dari parameter route
const asString = (v: any): string => (typeof v === "string" ? v : "");

// Hitung sisa waktu dari string deadline (kosong jika format tidak dikenali)
function hitungCountdown(deadline?: string): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "Lewat deadline";
  const hari = Math.floor(diff / 86400000);
  const jam = Math.floor((diff % 86400000) / 3600000);
  return hari > 0 ? `${hari} Hari ${jam} Jam` : `${jam} Jam`;
}

function mapClass(c: any, userId: string) {
  const kelasId = c.KELAS_ID ?? c.kelas_id;
  const kode = c.KODE_KELAS ?? c.kode_kelas;
  const nama = c.NAMA_KELAS ?? c.nama_kelas;
  const peran: string = c.PERAN ?? c.peran ?? "";
  const pembuat = String(c.DIBUAT_OLEH ?? c.dibuat_oleh ?? "") === String(userId);
  const isPjmk = peran.includes("PJMK") || pembuat;

  return {
    kelas_id: kelasId,
    kode_kelas: kode,
    code: kode,
    name: nama,
    nama_kelas: nama,
    room: c.RUANGAN ?? c.ruangan ?? "",
    role: peran || (pembuat ? "PJMK (Admin Kelas)" : "Mahasiswa"),
    isPjmk,
    matkulCount: c.JUMLAH_MATKUL ?? c.jumlah_matkul ?? 0,
    activeTasks: c.JUMLAH_TUGAS ?? c.jumlah_tugas, // jika undefined, dihitung dari daftar tugas
    members: c.JUMLAH_ANGGOTA ?? c.jumlah_anggota ?? 0,
    urgent: false,
  };
}

function mapTask(t: any) {
  const deadline = t.DEADLINE ?? t.deadline ?? "";
  const statusServer = String(t.STATUS_USER ?? t.status ?? "").toLowerCase();
  return {
    id: t.TASK_ID ?? t.task_id ?? t.id,
    kelas_id: t.KELAS_ID ?? t.kelas_id,
    subject: t.MATA_KULIAH ?? t.mata_kuliah ?? "-",
    title: t.JUDUL_TUGAS ?? t.judul_tugas ?? "-",
    deadline: deadline || "-",
    countdown: hitungCountdown(deadline),
    dosen: t.DOSEN ?? t.dosen ?? "-",
    description: t.DESKRIPSI ?? t.deskripsi ?? "",
    creator: `Dicatat oleh ${t.NAMA_PEMBUAT ?? t.DIBUAT_OLEH ?? t.dibuat_oleh ?? "-"}`,
    status: statusServer === "selesai" ? "Selesai" : "Belum Dikerjakan",
    color: "#0B4A9E",
  };
}

export default function Dashboard() {
  const params = useLocalSearchParams();

  // Pengguna aktif: sepenuhnya berasal dari hasil login server (tanpa akun default)
  const currentUser = {
    userId: asString(params.userId),
    nama: asString(params.nama),
    nim: asString(params.nim),
    email: asString(params.email),
    role: asString(params.role) || "Mahasiswa",
  };
  const userInitial = (currentUser.nama || "?").charAt(0).toUpperCase();

  // Tab Utama: "beranda" | "catatan" | "notifikasi"
  const [activeTab, setActiveTab] = useState<string>("beranda");

  // Navigasi Sub-View: null | "daftar-tugas-kelas" | "detail-tugas" | "anggota-kelas" | "buat-kelas" | "gabung-kelas" | "form-tugas"
  const [subView, setSubView] = useState<string | null>(null);

  // Kelas & Tugas yang sedang dipilih
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Modal State
  const [ubahDeadlineVisible, setUbahDeadlineVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Status Koneksi Server Backend
  const [serverStatus, setServerStatus] = useState<string>("Mengecek koneksi...");
  const [customIpInput, setCustomIpInput] = useState<string>(CURRENT_LAN_IP);
  const [checkingConn, setCheckingConn] = useState<boolean>(false);

  // Data dari server (awal kosong)
  const [classList, setClassList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  // Jika tidak ada sesi login, kembali ke halaman login
  useEffect(() => {
    if (!currentUser.userId) {
      router.replace("/");
    }
  }, []);

  // Muat data dari server saat dashboard dibuka
  useEffect(() => {
    if (!currentUser.userId) return;
    loadData().finally(() => setLoading(false));
    verifyConnection();
  }, [currentUser.userId]);

  const verifyConnection = async () => {
    try {
      const conn = await checkServerConnection();
      if (conn.ok) {
        setServerStatus(`Terhubung ke Backend (${conn.url})`);
      } else {
        setServerStatus(`Gagal terhubung ke Backend (${conn.url})`);
      }
    } catch {
      setServerStatus("Gagal terhubung ke Backend");
    }
  };

  // Ambil kelas & tugas dari server. Mengembalikan daftar tugas terbaru (atau null jika gagal)
  const loadData = async (): Promise<any[] | null> => {
    setLoadError("");
    let freshTasks: any[] | null = null;

    try {
      const serverClasses = await fetchClasses(currentUser.userId);
      const list = Array.isArray(serverClasses) ? serverClasses : [];
      setClassList(list.map((c: any) => mapClass(c, currentUser.userId)));
    } catch (e: any) {
      setLoadError(e?.message || "Gagal memuat daftar kelas dari server.");
    }

    try {
      const serverTasks = await fetchTasks(currentUser.userId);
      const list = Array.isArray(serverTasks) ? serverTasks : [];
      freshTasks = list.map(mapTask);
      setTasks(freshTasks);
    } catch (e: any) {
      setLoadError((prev) => prev || e?.message || "Gagal memuat tugas dari server.");
    }

    return freshTasks;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await verifyConnection();
    setRefreshing(false);
  };

  // Hitung tugas aktif per kelas dari daftar tugas (jika server tidak mengirim jumlahnya)
  const countActiveTasks = (kelasId: any) =>
    tasks.filter(
      (t) => String(t.kelas_id) === String(kelasId) && t.status !== "Selesai"
    ).length;

  // Sinkronkan tugas yang sedang dibuka dengan data terbaru dari server
  const refreshSelectedTask = (freshTasks: any[] | null) => {
    if (!freshTasks || !selectedTask) return;
    const updated = freshTasks.find((t) => String(t.id) === String(selectedTask.id));
    if (updated) setSelectedTask(updated);
  };

  // Navigasi Buka Kelas
  const handleOpenClass = (cls: any) => {
    setSelectedClass(cls);
    setSubView("daftar-tugas-kelas");
  };

  // Toggle Status Tugas: kirim ke server dulu, ubah tampilan setelah berhasil
  const handleToggleTaskStatus = async (taskId: string | number, newStatus: string) => {
    try {
      await updateTaskStatus(String(taskId), currentUser.userId, newStatus.toLowerCase());
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setSelectedTask((prev: any) =>
        prev && prev.id === taskId ? { ...prev, status: newStatus } : prev
      );
    } catch (e: any) {
      Alert.alert("Gagal Memperbarui Status", e?.message || "Tidak dapat terhubung ke server.");
    }
  };

  // Hapus Tugas (PJMK): hapus di server dulu, baru ubah tampilan
  const handleDeleteTask = async (taskId: string | number) => {
    Alert.alert(
      "Hapus Tugas? 🗑",
      "Apakah Anda yakin ingin menghapus tugas ini? Tugas akan dihapus untuk seluruh anggota kelas.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(String(taskId));
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
              setSubView("daftar-tugas-kelas");
              setSelectedTask(null);
              Alert.alert("Berhasil", "Tugas telah berhasil dihapus.");
            } catch (e: any) {
              Alert.alert("Gagal Menghapus", e?.message || "Tidak dapat terhubung ke server.");
            }
          },
        },
      ]
    );
  };

  // Callback Simpan Tugas Baru / Ubah Tugas: ambil ulang data dari server
  const handleTaskSaved = async (_savedTask: any) => {
    const fresh = await loadData();
    refreshSelectedTask(fresh);
    setSubView("daftar-tugas-kelas");
    setEditingTask(null);
  };

  // Callback Deadline Diperbarui
  const handleDeadlineUpdated = async (_updatedTask: any) => {
    const fresh = await loadData();
    refreshSelectedTask(fresh);
    setUbahDeadlineVisible(false);
  };

  // Callback Kelas Baru Dibuat
  const handleClassCreated = async (_newCls: any) => {
    await loadData();
  };

  // Callback Berhasil Gabung Kelas
  const handleClassJoined = async (_joinedClass: any) => {
    await loadData();
    setSubView(null);
  };

  // Simpan IP Kustom untuk koneksi Expo Go antar-perangkat
  const handleSaveCustomIp = async () => {
    if (!customIpInput.trim()) return;
    setCheckingConn(true);
    const newUrl = `http://${customIpInput.trim()}:${BACKEND_PORT}`;
    setCustomBaseUrl(newUrl);
    try {
      const conn = await checkServerConnection();
      if (conn.ok) {
        Alert.alert("Koneksi Berhasil! ✅", `Terhubung ke backend di ${newUrl}`);
        setServerStatus(`Terhubung ke Backend (${newUrl})`);
        await loadData();
      } else {
        Alert.alert("Gagal Terhubung ⚠️", `Tidak dapat menghubungi ${newUrl}. Periksa firewall dan port.`);
        setServerStatus(`Gagal terhubung ke Backend (${newUrl})`);
      }
    } finally {
      setCheckingConn(false);
    }
  };

  // Tanpa sesi login, jangan tampilkan apa pun (pengguna dialihkan ke login)
  if (!currentUser.userId) {
    return null;
  }

  // =========================================================================
  // SUB-VIEWS RENDERING
  // =========================================================================

  // 1. Sub-View: Daftar Tugas Kelas
  if (subView === "daftar-tugas-kelas" && selectedClass) {
    const classTasks = tasks.filter(
      (t) => String(t.kelas_id) === String(selectedClass.kelas_id)
    );

    return (
      <DaftarTugasKelasComp
        kelas={selectedClass}
        currentUser={currentUser}
        tasks={classTasks}
        onBack={() => setSubView(null)}
        onOpenTaskDetail={(t: any) => {
          setSelectedTask(t);
          setSubView("detail-tugas");
        }}
        onOpenMembers={() => setSubView("anggota-kelas")}
        onAddNewTask={() => {
          setEditingTask(null);
          setSubView("form-tugas");
        }}
        onToggleTask={(taskId: any) => {
          const t = tasks.find((x) => x.id === taskId);
          const next = t?.status === "Selesai" ? "Belum Dikerjakan" : "Selesai";
          handleToggleTaskStatus(taskId, next);
        }}
      />
    );
  }

  // 2. Sub-View: Detail Tugas
  if (subView === "detail-tugas" && selectedTask) {
    return (
      <View style={{ flex: 1 }}>
        <DetailTugasComp
          task={selectedTask}
          currentUser={currentUser}
          onBack={() => setSubView("daftar-tugas-kelas")}
          onToggleStatus={(taskId: any, newStatus: string) =>
            handleToggleTaskStatus(taskId, newStatus)
          }
          onOpenUbahDeadline={() => setUbahDeadlineVisible(true)}
          onOpenEditTask={(taskToEdit: any) => {
            setEditingTask(taskToEdit);
            setSubView("form-tugas");
          }}
          onDeleteTask={(taskId: any) => handleDeleteTask(taskId)}
        />

        {/* Modal Ubah Deadline (Bottom Sheet) */}
        <UbahDeadlineComp
          visible={ubahDeadlineVisible}
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setUbahDeadlineVisible(false)}
          onDeadlineUpdated={handleDeadlineUpdated}
        />
      </View>
    );
  }

  // 3. Sub-View: Anggota Kelas
  if (subView === "anggota-kelas" && selectedClass) {
    return (
      <AnggotaKelasComp
        kelas={selectedClass}
        currentUser={currentUser}
        onBack={() => setSubView("daftar-tugas-kelas")}
      />
    );
  }

  // 4. Sub-View: Buat Kelas
  if (subView === "buat-kelas") {
    return (
      <BuatKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassCreated={handleClassCreated}
      />
    );
  }

  // 5. Sub-View: Gabung Kelas
  if (subView === "gabung-kelas") {
    return (
      <GabungKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassJoined={handleClassJoined}
      />
    );
  }

  // 6. Sub-View: Form Tambah / Ubah Tugas
  if (subView === "form-tugas") {
    return (
      <FormTugasComp
        task={editingTask}
        kelas={selectedClass || classList[0]}
        currentUser={currentUser}
        onBack={() => setSubView(selectedTask ? "detail-tugas" : "daftar-tugas-kelas")}
        onTaskSaved={handleTaskSaved}
      />
    );
  }

  // =========================================================================
  // MAIN VIEW RENDERING: 3 BOTTOM TABS
  // =========================================================================

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER UTAMA */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appBrand}>Tasky</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "beranda"
              ? "Kelas / Tugas"
              : activeTab === "catatan"
              ? "Catatan Pribadi"
              : "Notifikasi"}
          </Text>
        </View>

        {/* Profil Avatar (untuk melihat profil, cek server & logout) */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => setAccountModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{userInitial}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ==================== TAB 1: BERANDA - DAFTAR KELAS ==================== */}
      {activeTab === "beranda" && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* KARTU SAPAAN MAHASISWA */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingName}>Halo, {currentUser.nama}! 👋</Text>
              <Text style={styles.greetingNim}>🪪 NIM: {currentUser.nim}</Text>
            </View>
            <View style={styles.greetingAvatarWrap}>
              <View style={styles.greetingAvatar}>
                <Text style={styles.greetingAvatarText}>{userInitial}</Text>
              </View>
            </View>
          </View>

          {/* DUA KARTU AKSI CEPAT (BUAT KELAS & GABUNG KELAS) */}
          <View style={styles.actionCardsRow}>
            <TouchableOpacity
              style={styles.blueActionCard}
              onPress={() => setSubView("buat-kelas")}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconCircleWhite}>
                <Text style={styles.actionIconPlus}>⊕</Text>
              </View>
              <Text style={styles.blueCardTitle}>Buat Kelas</Text>
              <Text style={styles.blueCardSub}>Khusus PJMK / Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lightActionCard}
              onPress={() => setSubView("gabung-kelas")}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconCircleBlue}>
                <Text style={styles.actionIconKey}>🔑</Text>
              </View>
              <Text style={styles.lightCardTitle}>Gabung Kelas</Text>
              <Text style={styles.lightCardSub}>Pakai Kode Undangan</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION HEADER: KELAS TERDAFTAR */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Kelas Terdaftar</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{classList.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Kelola Kelas",
                  "Gunakan tombol di atas untuk membuat atau bergabung ke kelas baru."
                )
              }
            >
              <Text style={styles.kelolaLink}>Kelola ›</Text>
            </TouchableOpacity>
          </View>

          {/* STATUS: MEMUAT / ERROR / KOSONG / DAFTAR KELAS */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
              <Text style={styles.loadingText}>Memuat data dari server...</Text>
            </View>
          ) : loadError && classList.length === 0 ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Gagal Memuat Data</Text>
              <Text style={styles.errorDesc}>{loadError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryBtnText}>🔄 Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : classList.length === 0 ? (
            <View style={styles.emptyClassCard}>
              <Text style={styles.emptyClassIcon}>🎓</Text>
              <Text style={styles.emptyClassTitle}>
                Belum Terdaftar di Kelas Manapun
              </Text>
              <Text style={styles.emptyClassDesc}>
                Anda belum bergabung ke kelas perkuliahan. Minta Kode Kelas dari
                PJMK Anda lalu klik tombol "Gabung Kelas" di atas, atau buat
                kelas baru jika Anda adalah PJMK.
              </Text>
              <TouchableOpacity
                style={styles.joinNowBtn}
                onPress={() => setSubView("gabung-kelas")}
              >
                <Text style={styles.joinNowBtnText}>
                  🔑 Gabung Kelas dengan Kode
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            classList.map((item, index) => {
              const isPjmkItem = item.role?.includes("PJMK") || item.isPjmk;
              const isPendamping = item.role?.includes("Pendamping");
              const activeCount =
                item.activeTasks ?? countActiveTasks(item.kelas_id);

              return (
                <TouchableOpacity
                  key={item.kelas_id || item.code || index}
                  style={styles.classCard}
                  onPress={() => handleOpenClass(item)}
                  activeOpacity={0.9}
                >
                  {/* BARIS ATAS: ROLE BADGE, KODE KELAS, & TITIK TIGA */}
                  <View style={styles.classCardTop}>
                    <View style={styles.badgeGroup}>
                      {isPjmkItem && !isPendamping && (
                        <View style={styles.pjmkBadge}>
                          <Text style={styles.pjmkBadgeText}>
                            👑 PJMK (Admin Kelas)
                          </Text>
                        </View>
                      )}

                      {isPendamping && (
                        <View style={styles.pendampingBadge}>
                          <Text style={styles.pendampingBadgeText}>
                            👥 PJMK Pendamping
                          </Text>
                        </View>
                      )}

                      {!isPjmkItem && !isPendamping && (
                        <View style={styles.mhsBadge}>
                          <Text style={styles.mhsBadgeText}>🎓 Mahasiswa</Text>
                        </View>
                      )}

                      {item.urgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>
                            🔥 {item.urgentText || "Mendesak"}
                          </Text>
                        </View>
                      )}

                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>
                          {item.code || item.kode_kelas}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.moreIcon}>⋮</Text>
                  </View>

                  {/* NAMA KELAS & RUANGAN */}
                  <Text style={styles.classCardTitle}>
                    {item.name || item.nama_kelas}
                  </Text>
                  {item.room ? (
                    <Text style={styles.classCardSubtitle}>{item.room}</Text>
                  ) : (
                    <View style={{ height: 14 }} />
                  )}

                  {/* FOOTER KELAS: MATKUL, TUGAS AKTIF, ANGGOTA, BUKA */}
                  <View style={styles.classCardFooter}>
                    <View style={styles.footerInfoRow}>
                      {item.matkulCount ? (
                        <Text style={styles.footerItemText}>
                          📚 {item.matkulCount} Matkul
                        </Text>
                      ) : null}

                      <Text style={styles.footerItemText}>
                        ⏰ {activeCount} Tugas Aktif
                      </Text>

                      {item.members ? (
                        <Text style={styles.footerItemText}>
                          👥 {item.members} Mhs
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.bukaLink}>Buka ➔</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ==================== TAB 2: CATATAN PRIBADI ==================== */}
      {activeTab === "catatan" && (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
          <CatatanComp
            currentUser={currentUser}
            activeClass={selectedClass || classList[0]}
          />
        </View>
      )}

      {/* ==================== TAB 3: NOTIFIKASI ==================== */}
      {activeTab === "notifikasi" && (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
          <NotifikasiComp
            currentUser={currentUser}
            onOpenTask={() => {
              if (tasks.length > 0) {
                setSelectedTask(tasks[0]);
                setSubView("detail-tugas");
              }
            }}
          />
        </View>
      )}

      {/* ==================== 3 BOTTOM TABS ==================== */}
      <View style={styles.bottomTabBar}>
        {/* Tab 1: Kelas / Tugas */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("beranda")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "beranda" && styles.tabIconActive,
            ]}
          >
            📋
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "beranda" && styles.tabLabelActive,
            ]}
          >
            Kelas / Tugas
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Catatan */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("catatan")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "catatan" && styles.tabIconActive,
            ]}
          >
            📝
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "catatan" && styles.tabLabelActive,
            ]}
          >
            Catatan
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Notifikasi */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("notifikasi")}
          activeOpacity={0.8}
        >
          <View>
            <Text
              style={[
                styles.tabIcon,
                activeTab === "notifikasi" && styles.tabIconActive,
              ]}
            >
              🔔
            </Text>
            <View style={styles.redDot} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "notifikasi" && styles.tabLabelActive,
            ]}
          >
            Notifikasi
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* MODAL PROFIL, KONEKSI BACKEND & LOGOUT                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Profil & Pengaturan Akun</Text>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Info Akun Aktif */}
            <View style={styles.userProfileCard}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>{userInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileNameLarge}>{currentUser.nama}</Text>
                <Text style={styles.profileSubLarge}>
                  {currentUser.nim} • {currentUser.email}
                </Text>
                <View style={styles.profileRolePill}>
                  <Text style={styles.profileRolePillText}>
                    {currentUser.role}
                  </Text>
                </View>
              </View>
            </View>

            {/* KONEKSI SERVER (EXPO GO / WEB / LAN) */}
            <Text style={styles.sheetSectionTitle}>Koneksi Server Backend:</Text>
            <View style={styles.serverCard}>
              <Text style={styles.serverStatusLabel}>Status Backend:</Text>
              <Text style={styles.serverStatusValue}>{serverStatus}</Text>

              <Text style={styles.ipHelpText}>
                Hubungkan HP Android/iOS (Expo Go) ke Wi-Fi yang sama:
              </Text>
              <View style={styles.ipInputRow}>
                <TextInput
                  style={styles.ipInput}
                  value={customIpInput}
                  onChangeText={setCustomIpInput}
                  placeholder="IP Komputer (misal 192.168.100.81)"
                />
                <TouchableOpacity
                  style={styles.ipSaveBtn}
                  onPress={handleSaveCustomIp}
                  disabled={checkingConn}
                >
                  {checkingConn ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.ipSaveText}>Tes & Simpan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* TOMBOL LOGOUT */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setAccountModalVisible(false);
                router.replace("/");
              }}
            >
              <Text style={styles.logoutBtnText}>🚪 Keluar Akun (Logout)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================================================================
// STYLESHEET
// =========================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  appBrand: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primaryBlue,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.subText,
    fontWeight: "600",
  },
  avatarBtn: {
    padding: 2,
  },
  avatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DCEBF8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BADBFC",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primaryBlue,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  greetingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.navyText,
  },
  greetingNim: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 4,
    fontWeight: "600",
  },
  greetingAvatarWrap: {
    marginLeft: 12,
  },
  greetingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B4A9E",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  actionCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  blueActionCard: {
    flex: 1,
    backgroundColor: "#0A3F88",
    borderRadius: 18,
    padding: 16,
    minHeight: 125,
    justifyContent: "center",
    shadowColor: "#0A3F88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconCircleWhite: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionIconPlus: {
    fontSize: 20,
    color: "#0A3F88",
    fontWeight: "900",
  },
  blueCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  blueCardSub: {
    fontSize: 11,
    color: "#CFE2FE",
    marginTop: 2,
    fontWeight: "500",
  },
  lightActionCard: {
    flex: 1,
    backgroundColor: "#DDECF8",
    borderRadius: 18,
    padding: 16,
    minHeight: 125,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C5DCF4",
  },
  actionIconCircleBlue: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A3F88",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionIconKey: {
    fontSize: 15,
  },
  lightCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A3F88",
  },
  lightCardSub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.navyText,
  },
  countPill: {
    backgroundColor: "#D9ECFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0B4A9E",
  },
  kelolaLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B4A9E",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#B91C1C",
  },
  errorDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: "#0A3F88",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyClassCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  emptyClassIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyClassTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.navyText,
    textAlign: "center",
  },
  emptyClassDesc: {
    fontSize: 12,
    color: COLORS.subText,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  joinNowBtn: {
    backgroundColor: "#0A3F88",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  joinNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  classCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  classCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  pjmkBadge: {
    backgroundColor: "#0B4A9E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pjmkBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  pendampingBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendampingBadgeText: {
    color: "#7E22CE",
    fontSize: 10,
    fontWeight: "800",
  },
  mhsBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mhsBadgeText: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "800",
  },
  urgentBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgentBadgeText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "800",
  },
  codeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  codeBadgeText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
  },
  moreIcon: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "900",
  },
  classCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.navyText,
    marginBottom: 4,
  },
  classCardSubtitle: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 14,
  },
  classCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  footerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerItemText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  bukaLink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B4A9E",
  },
  bottomTabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    color: "#94A3B8",
  },
  tabIconActive: {
    color: "#0B4A9E",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#0B4A9E",
    fontWeight: "800",
  },
  redDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.navyText,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },
  userProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0B4A9E",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  profileNameLarge: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.navyText,
  },
  profileSubLarge: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  profileRolePill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  profileRolePillText: {
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "700",
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.navyText,
    marginBottom: 8,
    marginTop: 6,
  },
  serverCard: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  serverStatusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  serverStatusValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B4A9E",
    marginTop: 2,
    marginBottom: 8,
  },
  ipHelpText: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 6,
  },
  ipInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  ipInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#1E293B",
  },
  ipSaveBtn: {
    backgroundColor: "#0B4A9E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
  },
  ipSaveText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  logoutBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },
});