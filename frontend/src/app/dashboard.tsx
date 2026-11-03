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
  getBaseUrl,
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

// Data Default Kelas PJMK (Dimas Pratama) sesuai Mockup Desain Terbaru
const DEFAULT_PJMK_CLASSES = [
  {
    kelas_id: "k_ti21",
    kode_kelas: "TI21-A89K",
    code: "TI21-A89K",
    name: "Teknik Informatika 2021 - Reguler A",
    nama_kelas: "Teknik Informatika 2021 - Reguler A",
    room: "Fakultas MIPA • Universitas Udayana",
    role: "PJMK (Admin Kelas)",
    isPjmk: true,
    matkulCount: 4,
    activeTasks: 5,
    members: 48,
    urgent: false,
    urgentText: "",
  },
  {
    kelas_id: "k_simb",
    kode_kelas: "SIM-B02",
    code: "SIM-B02",
    name: "Sistem Informasi Manajemen - B",
    nama_kelas: "Sistem Informasi Manajemen - B",
    room: "Dosen: Dr. I Wayan Santika, S.T., M.Kom.",
    role: "Mahasiswa",
    isPjmk: false,
    matkulCount: 3,
    activeTasks: 2,
    members: 38,
    urgent: true,
    urgentText: "2 Tugas Mendesak",
    footerDeadline: "Deadline < 24 Jam",
  },
  {
    kelas_id: "k_kbds",
    kode_kelas: "KBDS-21",
    code: "KBDS-21",
    name: "Kecerdasan Buatan & Data Science - 2021",
    nama_kelas: "Kecerdasan Buatan & Data Science - 2021",
    room: "Laboratorium Komputasi Cerdas",
    role: "PJMK Pendamping",
    isPjmk: false,
    matkulCount: 2,
    activeTasks: 2,
    members: 48,
    urgent: false,
    urgentText: "",
  },
];

// Data Default Tugas sesuai Mockup Desain Terbaru
const DEFAULT_TASKS = [
  {
    id: "t_pwl_jwt",
    kelas_id: "k_ti21",
    subject: "Pemrograman Web Lanjut",
    title: "Implementasi RESTful API & Autentikasi JWT",
    deadline: "Kamis, 15 Nov 2024 • 23:59 WIB",
    countdown: "1 Hari 4 Jam",
    dosen: "Dr. Aris Munandar, M.Kom",
    description:
      "Buatlah endpoint autentikasi menggunakan format JSON Web Token (JWT) dengan refresh token. Pastikan skema database menyertakan tabel user, role, dan token whitelist. Struktur folder mengikuti MVC arsitektur bersih.",
    creator: "Dicatat oleh PJMK (Dimas Pratama)",
    status: "Belum Dikerjakan",
    color: "#0B4A9E",
  },
  {
    id: "t_mongodb",
    kelas_id: "k_ti21",
    subject: "Basis Data Terdistribusi",
    title: "Perancangan Skema Sharding & Replikasi MongoDB",
    deadline: "18 Nov 2024, 17:00 WIB",
    countdown: "3 Hari lagi",
    dosen: "Ir. Ketut Dharma, M.T.",
    description:
      "Simulasi cluster 3 shard dengan mongos router, uji failover saat primary node replica set mati.",
    creator: "Dicatat oleh PJMK (Dimas Pratama)",
    status: "Selesai",
    color: "#9333EA",
  },
  {
    id: "t_routing",
    kelas_id: "k_ti21",
    subject: "Jaringan Komputer",
    title: "Laporan Praktikum Subnetting CIDR & Routing BGP",
    deadline: "20 Nov 2024, 23:59 WIB",
    countdown: "5 Hari lagi",
    dosen: "Gede Arya, S.Kom., M.Cs.",
    description:
      "Konfigurasi topologi 4 Autonomous System di Cisco Packet Tracer lengkap dengan screenshot tabel routing.",
    creator: "Dicatat oleh PJMK (Dimas Pratama)",
    status: "Belum Dikerjakan",
    color: "#2563EB",
  },
];

export default function Dashboard() {
  const params = useLocalSearchParams();

  // State Pengguna Aktif
  const [currentUser, setCurrentUser] = useState({
    userId: typeof params.userId === "string" ? params.userId : "u_pjmk_dimas",
    nama: typeof params.nama === "string" ? params.nama : "Dimas Pratama",
    nim: typeof params.nim === "string" ? params.nim : "2108561042",
    email: typeof params.email === "string" ? params.email : "pjmk@kampus.ac.id",
    role: typeof params.role === "string" ? params.role : "PJMK Utama",
    isNewUser:
      params.isNewUser === "true" ||
      (typeof params.email === "string" && params.email.includes("baru")) ||
      (typeof params.nama === "string" && params.nama.includes("Baru")),
  });

  // Tab Utama (3 Tab sesuai Mockup Desain Terbaru): "beranda" | "catatan" | "notifikasi"
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

  // Data Kelas & Tugas
  const [classList, setClassList] = useState<any[]>(
    currentUser.isNewUser ? [] : DEFAULT_PJMK_CLASSES
  );
  const [tasks, setTasks] = useState<any[]>(DEFAULT_TASKS);

  // Muat data saat pengguna berganti
  useEffect(() => {
    loadClassesAndTasks();
    verifyConnection();
  }, [currentUser.userId, currentUser.isNewUser]);

  const verifyConnection = async () => {
    try {
      const conn = await checkServerConnection();
      if (conn.ok) {
        setServerStatus(`Terhubung ke Backend (${conn.url})`);
      } else {
        setServerStatus(`Mode Offline (Lokal) - ${conn.url}`);
      }
    } catch {
      setServerStatus("Mode Offline (Lokal)");
    }
  };

  const loadClassesAndTasks = async () => {
    // Aturan Mahasiswa Baru: Jika akun baru, kelas kosong (0 kelas) sampai bergabung
    if (currentUser.isNewUser) {
      setClassList([]);
      return;
    }

    try {
      const serverClasses = await fetchClasses(currentUser.userId);
      if (Array.isArray(serverClasses) && serverClasses.length > 0) {
        const mapped = serverClasses.map((c: any) => ({
          kelas_id: c.KELAS_ID || c.kelas_id,
          kode_kelas: c.KODE_KELAS || c.kode_kelas,
          code: c.KODE_KELAS || c.kode_kelas,
          name: c.NAMA_KELAS || c.nama_kelas,
          nama_kelas: c.NAMA_KELAS || c.nama_kelas,
          room: "Fakultas MIPA • Universitas Udayana",
          role: c.PERAN || (c.DIBUAT_OLEH === currentUser.userId ? "PJMK (Admin Kelas)" : "Mahasiswa"),
          isPjmk: c.PERAN?.includes("PJMK") || c.DIBUAT_OLEH === currentUser.userId,
          matkulCount: 3,
          activeTasks: c.JUMLAH_TUGAS || 3,
          members: c.JUMLAH_ANGGOTA || 48,
          urgent: false,
        }));
        setClassList(mapped);
      } else {
        // Gunakan default PJMK jika backend kosong
        setClassList(DEFAULT_PJMK_CLASSES);
      }
    } catch (e) {
      // Fallback offline
      setClassList(DEFAULT_PJMK_CLASSES);
    }

    try {
      const serverTasks = await fetchTasks(currentUser.userId);
      if (Array.isArray(serverTasks) && serverTasks.length > 0) {
        const formatted = serverTasks.map((t: any) => ({
          id: t.TASK_ID || t.id,
          kelas_id: t.KELAS_ID || t.kelas_id,
          subject: t.MATA_KULIAH || t.mata_kuliah || "Pemrograman Web Lanjut",
          title: t.JUDUL_TUGAS || t.judul_tugas,
          deadline: t.DEADLINE || "15 Nov 2024, 23:59 WIB",
          countdown: "1 Hari 4 Jam",
          dosen: "Dr. Aris Munandar, M.Kom",
          description: t.DESKRIPSI || t.deskripsi || "Tugas perkuliahan semester aktif.",
          creator: `Dicatat oleh ${t.DIBUAT_OLEH || "PJMK (Dimas Pratama)"}`,
          status:
            t.STATUS_USER === "selesai" || t.status === "Selesai"
              ? "Selesai"
              : "Belum Dikerjakan",
          color: "#0B4A9E",
        }));
        setTasks(formatted);
      }
    } catch (e) {
      // Fallback offline
    }
  };

  // Navigasi Buka Kelas
  const handleOpenClass = (cls: any) => {
    setSelectedClass(cls);
    setSubView("daftar-tugas-kelas");
  };

  // Toggle Status Tugas
  const handleToggleTaskStatus = async (taskId: string | number, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    try {
      await updateTaskStatus(String(taskId), currentUser.userId, newStatus.toLowerCase());
    } catch (e) {
      // Tersimpan lokal offline
    }
  };

  // Hapus Tugas (PJMK)
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
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setSubView("daftar-tugas-kelas");
            setSelectedTask(null);
            try {
              await deleteTask(String(taskId));
            } catch (e) {
              // Tersimpan lokal
            }
            Alert.alert("Berhasil", "Tugas telah berhasil dihapus.");
          },
        },
      ]
    );
  };

  // Callback Simpan Tugas Baru / Ubah Tugas
  const handleTaskSaved = (savedTask: any) => {
    const exists = tasks.find((t) => t.id === savedTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? { ...t, ...savedTask } : t)));
      if (selectedTask?.id === savedTask.id) {
        setSelectedTask({ ...selectedTask, ...savedTask });
      }
    } else {
      setTasks([savedTask, ...tasks]);
    }
    setSubView("daftar-tugas-kelas");
    setEditingTask(null);
  };

  // Callback Deadline Diperbarui
  const handleDeadlineUpdated = (updatedTask: any) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    setSelectedTask({ ...selectedTask, ...updatedTask });
    setUbahDeadlineVisible(false);
  };

  // Callback Kelas Baru Dibuat
  const handleClassCreated = (newCls: any) => {
    const formatted = {
      kelas_id: newCls.kelas_id || "k_" + Date.now(),
      kode_kelas: newCls.kode_kelas,
      code: newCls.kode_kelas,
      name: newCls.nama_kelas,
      nama_kelas: newCls.nama_kelas,
      room: "Fakultas MIPA • Universitas Udayana",
      role: "PJMK (Admin Kelas)",
      isPjmk: true,
      matkulCount: 1,
      activeTasks: 0,
      members: 1,
      urgent: false,
    };
    setClassList([formatted, ...classList]);
    setCurrentUser((prev) => ({ ...prev, isNewUser: false }));
  };

  // Callback Berhasil Gabung Kelas
  const handleClassJoined = (joinedClass: any) => {
    const formatted = {
      kelas_id: joinedClass.KELAS_ID || joinedClass.kelas_id || "k_" + Date.now(),
      kode_kelas: joinedClass.KODE_KELAS || joinedClass.kode_kelas,
      code: joinedClass.KODE_KELAS || joinedClass.kode_kelas,
      name: joinedClass.NAMA_KELAS || joinedClass.nama_kelas || joinedClass.name,
      nama_kelas: joinedClass.NAMA_KELAS || joinedClass.nama_kelas || joinedClass.name,
      room: "Fakultas MIPA • Universitas Udayana",
      role: "Mahasiswa",
      isPjmk: false,
      matkulCount: 3,
      activeTasks: 3,
      members: 48,
      urgent: false,
    };

    // Hindari duplikasi jika sudah ada
    if (!classList.some((c) => c.code === formatted.code)) {
      setClassList([formatted, ...classList]);
    }
    setCurrentUser((prev) => ({ ...prev, isNewUser: false }));
    setSubView(null);
  };

  // Switch Akun Cepat (Untuk pengujian akun PJMK vs Mahasiswa Baru)
  const switchAccount = (type: "pjmk" | "mhs_baru") => {
    if (type === "pjmk") {
      setCurrentUser({
        userId: "u_pjmk_dimas",
        nama: "Dimas Pratama",
        nim: "2108561042",
        email: "pjmk@kampus.ac.id",
        role: "PJMK Utama",
        isNewUser: false,
      });
      setClassList(DEFAULT_PJMK_CLASSES);
    } else {
      setCurrentUser({
        userId: "u_mhs_baru_" + Date.now(),
        nama: "Mahasiswa Baru",
        nim: "2108569999",
        email: "mhsbaru@kampus.ac.id",
        role: "Mahasiswa",
        isNewUser: true,
      });
      setClassList([]); // Mahasiswa baru belum masuk kelas manapun!
    }
    setSubView(null);
    setAccountModalVisible(false);
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
        setServerStatus(`Terhubung ke ${newUrl}`);
      } else {
        Alert.alert("Gagal Terhubung ⚠️", `Tidak dapat menghubungi ${newUrl}. Periksa firewall dan port.`);
      }
    } finally {
      setCheckingConn(false);
    }
  };

  // =========================================================================
  // SUB-VIEWS RENDERING
  // =========================================================================

  // 1. Sub-View: Daftar Tugas Kelas (Mockup Gambar 3 Kanan)
  if (subView === "daftar-tugas-kelas" && selectedClass) {
    const classTasks = tasks.filter(
      (t) =>
        !t.kelas_id ||
        t.kelas_id === selectedClass.kelas_id ||
        t.subject === selectedClass.name ||
        selectedClass.code === "TI21-A89K"
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

  // 2. Sub-View: Detail Tugas (Mockup Gambar 3 Kiri)
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

  // 3. Sub-View: Anggota Kelas (Mockup Gambar 5 Kiri)
  if (subView === "anggota-kelas" && selectedClass) {
    return (
      <AnggotaKelasComp
        kelas={selectedClass}
        currentUser={currentUser}
        onBack={() => setSubView("daftar-tugas-kelas")}
      />
    );
  }

  // 4. Sub-View: Buat Kelas Modal (Mockup Gambar 2 Kiri)
  if (subView === "buat-kelas") {
    return (
      <BuatKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassCreated={handleClassCreated}
      />
    );
  }

  // 5. Sub-View: Gabung Kelas Modal (Mockup Gambar 2 Kanan)
  if (subView === "gabung-kelas") {
    return (
      <GabungKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassJoined={handleClassJoined}
      />
    );
  }

  // 6. Sub-View: Form Tambah / Ubah Tugas (Mockup Gambar 4 Kiri)
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

        {/* Profil Avatar (Bisa Ditekan untuk Switch Akun & Cek Server) */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => setAccountModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>
              {currentUser.nama.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* BANNER STATUS OFFLINE / SINKRONISASI */}
      <View style={styles.offlineBanner}>
        <Text style={styles.bannerIcon}>🔔</Text>
        <Text style={styles.bannerText}>
          Mode Offline • Perubahan akan disinkronkan saat online
        </Text>
        <Text style={styles.bannerIcon}>🔔</Text>
      </View>

      {/* ==================== TAB 1: BERANDA - DAFTAR KELAS ==================== */}
      {activeTab === "beranda" && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* KARTU SAPAAN MAHASISWA */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingName}>Halo, {currentUser.nama}! 👋</Text>
              <Text style={styles.greetingNim}>
                🪪 NIM: {currentUser.nim} • Smt 6
              </Text>
            </View>
            <View style={styles.greetingAvatarWrap}>
              <View style={styles.greetingAvatar}>
                <Text style={styles.greetingAvatarText}>
                  {currentUser.nama.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* DUA KARTU AKSI CEPAT (BUAT KELAS & GABUNG KELAS) */}
          <View style={styles.actionCardsRow}>
            {/* Tombol Buat Kelas (Khusus PJMK / Admin) */}
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

            {/* Tombol Gabung Kelas (Pakai Kode Undangan) */}
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

          {/* ATURAN MAHASISWA BARU: KELAS KOSONG JIKA BELUM GABUNG */}
          {classList.length === 0 ? (
            <View style={styles.emptyClassCard}>
              <Text style={styles.emptyClassIcon}>🎓</Text>
              <Text style={styles.emptyClassTitle}>
                Belum Terdaftar di Kelas Manapun
              </Text>
              <Text style={styles.emptyClassDesc}>
                Anda belum bergabung ke kelas perkuliahan. Minta 6-8 digit Kode
                Kelas dari PJMK Anda lalu klik tombol "Gabung Kelas" di atas, atau
                buat kelas baru jika Anda adalah PJMK.
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
            /* DAFTAR KARTU KELAS SESUAI MOCKUP FIGMA GAMBAR 1 KANAN */
            classList.map((item, index) => {
              const isPjmkItem =
                item.role?.includes("PJMK") || item.isPjmk;
              const isPendamping = item.role?.includes("Pendamping");

              return (
                <TouchableOpacity
                  key={item.code || item.kode_kelas || index}
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

                  {/* NAMA KELAS & DOSEN / RUANGAN */}
                  <Text style={styles.classCardTitle}>
                    {item.name || item.nama_kelas}
                  </Text>
                  <Text style={styles.classCardSubtitle}>{item.room}</Text>

                  {/* FOOTER KELAS: MATKUL, TUGAS AKTIF, BUKA */}
                  <View style={styles.classCardFooter}>
                    <View style={styles.footerInfoRow}>
                      {item.matkulCount ? (
                        <Text style={styles.footerItemText}>
                          📚 {item.matkulCount} Matkul
                        </Text>
                      ) : null}

                      <Text
                        style={[
                          styles.footerItemText,
                          item.urgent && styles.urgentFooterText,
                        ]}
                      >
                        ⏰{" "}
                        {item.footerDeadline
                          ? item.footerDeadline
                          : `${item.activeTasks || 0} Tugas Aktif`}
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

          {/* KARTU SINKRONISASI OTOMATIS */}
          <View style={styles.syncCard}>
            <Text style={styles.syncCardIcon}>🔄</Text>
            <View style={styles.syncTextWrap}>
              <Text style={styles.syncCardTitle}>Sinkronisasi Otomatis</Text>
              <Text style={styles.syncCardDesc}>
                Data lokal Anda aman. Begitu jaringan pulih, tugas & progres
                tersimpan ke server.
              </Text>
            </View>
          </View>

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

      {/* ==================== 3 BOTTOM TABS SESUAI FIGMA ==================== */}
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
      {/* MODAL PENGATURAN AKUN, SWITCH PROFILE & KONEKSI BACKEND MULTI-DEVICE    */}
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
                <Text style={styles.profileAvatarText}>
                  {currentUser.nama.charAt(0).toUpperCase()}
                </Text>
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

            {/* SWITCH AKUN CEPAT SESUAI PERMINTAAN PENGUJIAN SRS */}
            <Text style={styles.sheetSectionTitle}>
              Beralih Akun (Uji Fitur & Aturan SRS):
            </Text>

            <TouchableOpacity
              style={[
                styles.accountOptionCard,
                !currentUser.isNewUser && styles.accountOptionActive,
              ]}
              onPress={() => switchAccount("pjmk")}
            >
              <Text style={styles.accountOptionEmoji}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountOptionTitle}>
                  Dimas Pratama (PJMK)
                </Text>
                <Text style={styles.accountOptionSub}>
                  Memiliki 3 kelas terdaftar & hak akses penuh mengelola tugas.
                </Text>
              </View>
              {!currentUser.isNewUser ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountOptionCard,
                currentUser.isNewUser && styles.accountOptionActive,
              ]}
              onPress={() => switchAccount("mhs_baru")}
            >
              <Text style={styles.accountOptionEmoji}>🎓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountOptionTitle}>
                  Mahasiswa Baru (0 Kelas)
                </Text>
                <Text style={styles.accountOptionSub}>
                  Belum masuk kelas manapun sampai memasukkan kode undangan.
                </Text>
              </View>
              {currentUser.isNewUser ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </TouchableOpacity>

            {/* KONEKSI MULTI-DEVICE (EXPO GO / WEB / LAN) */}
            <Text style={styles.sheetSectionTitle}>
              Koneksi Server Backend (Multi-Device):
            </Text>
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
  offlineBanner: {
    backgroundColor: "#FDF4E7",
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8DFB7",
  },
  bannerIcon: {
    fontSize: 12,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
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
  urgentFooterText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  bukaLink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B4A9E",
  },
  syncCard: {
    backgroundColor: "#EBF3FC",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#D2E4F7",
  },
  syncCardIcon: {
    fontSize: 22,
  },
  syncTextWrap: {
    flex: 1,
  },
  syncCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B4A9E",
  },
  syncCardDesc: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    marginTop: 2,
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
  accountOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    gap: 10,
  },
  accountOptionActive: {
    borderColor: "#0B4A9E",
    backgroundColor: "#F0F7FF",
  },
  accountOptionEmoji: {
    fontSize: 22,
  },
  accountOptionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navyText,
  },
  accountOptionSub: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0B4A9E",
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
