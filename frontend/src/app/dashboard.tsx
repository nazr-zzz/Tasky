import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

import DaftarTugasKelasScreen from "../screens/DaftarTugasKelasScreen";
import DetailTugasScreen from "../screens/DetailTugasScreen";
import AnggotaKelasScreen from "../screens/AnggotaKelasScreen";
import BuatKelasScreen from "../screens/BuatKelasModal";
import GabungKelasScreen from "../screens/GabungKelasModal";
import FormTugasScreen from "../screens/FormTugasModal";
import UbahDeadlineModal from "../screens/UbahDeadlineModal";
import CatatanScreen from "../screens/CatatanScreen";
import NotifikasiScreen from "../screens/NotifikasiScreen";
import ProfilScreen from "../screens/ProfilScreen";
import PendingTasksModal from "../screens/PendingTasksScreen";
import NearestDeadlineModal from "../screens/NearestDeadlineScreen";

const PendingTasksComp: any = PendingTasksModal;
const NearestDeadlineComp: any = NearestDeadlineModal;

import {
  fetchTasks,
  updateTaskStatus,
  deleteTask,
  fetchClasses,
  fetchNotifications,
  fetchProfile,
  getPjmkStatus,
  checkServerConnection,
  setCustomBaseUrl,
  CURRENT_LAN_IP,
  BACKEND_PORT,
} from "../services/api";
import { sinkronPengingat } from "../services/pengingat";

const DaftarTugasKelasComp: any = DaftarTugasKelasScreen;
const DetailTugasComp: any = DetailTugasScreen;
const AnggotaKelasComp: any = AnggotaKelasScreen;
const BuatKelasComp: any = BuatKelasScreen;
const GabungKelasComp: any = GabungKelasScreen;
const FormTugasComp: any = FormTugasScreen;
const UbahDeadlineComp: any = UbahDeadlineModal;
const CatatanComp: any = CatatanScreen;
const NotifikasiComp: any = NotifikasiScreen;
const ProfilComp: any = ProfilScreen;

// [REVISI 6] true = dashboard menambahkan jarak atas (jam/status bar) untuk semua sub-layar.
// Kalau setelah dicoba jaraknya jadi DOBEL (karena sub-layar sudah memakai SafeAreaView
// sendiri), ubah menjadi false.
const TAMBAH_SAFE_AREA_SUBLAYAR = true;

const COLORS = {
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  primaryBlue: "#0047BA",
  primaryHover: "#003994",
  lightBlueCard: "#EEF4FF",
  lightBlueBg: "#F0F7FF",
  accentBlue: "#1D4ED8",
  navyText: "#0F172A",
  subText: "#64748B",
  border: "#E2E8F0",
  urgentBadge: "#FEE2E2",
  urgentText: "#DC2626",
  warningBg: "#FEF3C7",
  warningText: "#B45309",
  successBg: "#DCFCE7",
  successText: "#15803D",
  purpleBg: "#F3E8FF",
  purpleText: "#7E22CE",
};

const asString = (v: any): string => (typeof v === "string" ? v : "");

// Hitung mundur sesuai tenggat yang diinput PJMK (jam & menit ikut dihitung)
function hitungCountdown(deadline?: any): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "Lewat deadline";
  const hari = Math.floor(diff / 86400000);
  const jam = Math.floor((diff % 86400000) / 3600000);
  const menit = Math.floor((diff % 3600000) / 60000);
  if (hari > 0) return `${hari} Hari ${jam} Jam`;
  if (jam > 0) return `${jam} Jam ${menit} Menit`;
  return `${menit} Menit`;
}

// [REVISI 4/7] Label "H-n" berdasarkan selisih hari kalender sebenarnya
function hitungLabelHari(deadline?: any): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  const awalDeadline = new Date(d);
  awalDeadline.setHours(0, 0, 0, 0);
  const selisih = Math.round((awalDeadline.getTime() - awalHariIni.getTime()) / 86400000);
  if (d.getTime() < Date.now()) return "Lewat";
  if (selisih <= 0) return "Hari ini";
  return `H-${selisih}`;
}

function formatDeadline(deadline?: any): string {
  if (!deadline) return "-";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return String(deadline);
  try {
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toLocaleString();
  }
}

// Tanggal saja (untuk kotak tanggal di kalender deadline)
function formatTanggalSaja(deadline?: any): string {
  if (!deadline) return "-";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "-";
  try {
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toLocaleDateString();
  }
}

function formatJamSaja(deadline?: any): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";
  try {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return d.toLocaleTimeString();
  }
}

function mapClass(c: any, userId: string) {
  const kelasId = c.KELAS_ID ?? c.kelas_id;
  const kode = c.KODE_KELAS ?? c.kode_kelas;
  const nama = c.NAMA_KELAS ?? c.nama_kelas;
  const peran: string = c.PERAN ?? c.peran ?? "";
  const peranLower = peran.toLowerCase();
  const pembuat = String(c.DIBUAT_OLEH ?? c.dibuat_oleh ?? "") === String(userId);

  // [REVISI 2/5] bedakan PJMK Utama, PJMK Pendamping, dan Mahasiswa
  const isUtama = peranLower.includes("pjmk utama") || pembuat;
  const isPendamping = !isUtama && peranLower.includes("pendamping");
  const isPjmk = isUtama || isPendamping || peranLower.includes("pjmk");

  return {
    kelas_id: kelasId,
    kode_kelas: kode,
    code: kode,
    name: nama,
    nama_kelas: nama,
    room: c.RUANGAN ?? c.ruangan ?? "",
    role: isUtama
      ? "PJMK Utama"
      : isPendamping
      ? "PJMK Pendamping"
      : peran || "Mahasiswa",
    isUtama,
    isPendamping,
    isPjmk,
    activeTasks: c.JUMLAH_TUGAS ?? c.jumlah_tugas ?? 0,
    members: c.JUMLAH_ANGGOTA ?? c.jumlah_anggota ?? 0,
    urgent: false,
  };
}

function mapTask(t: any) {
  const deadlineRaw = t.DEADLINE ?? t.deadline ?? "";
  const statusServer = String(t.STATUS_USER ?? t.status ?? "").toLowerCase();
  return {
    id: t.TASK_ID ?? t.task_id ?? t.id,
    kelas_id: t.KELAS_ID ?? t.kelas_id,
    subject: t.MATA_KULIAH ?? t.mata_kuliah ?? "Umum",
    title: t.JUDUL_TUGAS ?? t.judul_tugas ?? "-",
    deadline: formatDeadline(deadlineRaw),
    deadlineRaw: deadlineRaw ? String(deadlineRaw) : "",
    countdown: hitungCountdown(deadlineRaw),
    dosen: t.DOSEN ?? t.dosen ?? "Dosen Pengampu",
    description: t.DESKRIPSI ?? t.deskripsi ?? "",
    creator: `Dicatat oleh PJMK (${t.NAMA_PEMBUAT ?? t.DIBUAT_OLEH ?? t.dibuat_oleh ?? "Admin"})`,
    status: statusServer === "selesai" ? "Selesai" : "Belum Dikerjakan",
    color: "#0047BA",
  };
}

const TABS = [
  { key: "beranda", label: "Kelas / Tugas", iconOutline: "book-outline", iconFilled: "book" },
  { key: "catatan", label: "Catatan", iconOutline: "document-text-outline", iconFilled: "document-text" },
  { key: "notifikasi", label: "Notifikasi", iconOutline: "notifications-outline", iconFilled: "notifications" },
  { key: "profil", label: "Profil", iconOutline: "person-outline", iconFilled: "person" },
];

export default function Dashboard() {
   // Data user diambil dari AuthContext (bukan dari parameter route)
  const { user, logout } = useAuth() as any;
  const insets = useSafeAreaInsets();

  const str = (v: any): string =>
    v === undefined || v === null ? "" : String(v);

  const params: any = {
    userId: str(user?.userId ?? user?.uid),
    nama: str(user?.nama ?? user?.name),
    nim: str(user?.nim ?? user?.NIM),
    email: str(user?.email),
    semester: str(user?.semester),
    foto: str(user?.foto ?? user?.FOTO),
    role: str(user?.role),
  };

  // [REVISI 3/10] Data profil disimpan di state: tidak ada lagi NIM / semester bawaan Figma,
  // dan bisa diperbarui setelah edit profil atau dari data server.
  const [profil, setProfil] = useState({
    nama: asString(params.nama) || "Mahasiswa",
    nim: asString(params.nim),
    email: asString(params.email),
    semester: asString(params.semester),
    foto: asString(params.foto),
  });

  const currentUser = {
    userId: asString(params.userId),
    nama: profil.nama,
    nim: profil.nim,
    email: profil.email,
    semester: profil.semester,
    foto: profil.foto,
    role: asString(params.role) || "Mahasiswa",
  };

  // Terapkan data profil dari server / hasil edit (mendukung huruf besar & kecil)
  const terapkanProfil = useCallback((data: any) => {
    const src = data?.user ?? data?.data ?? data?.profil ?? data;
    if (!src || typeof src !== "object") return;
    const ambil = (...keys: string[]) => {
      for (const k of keys) {
        if (src[k] !== undefined && src[k] !== null && src[k] !== "") return String(src[k]);
      }
      return undefined;
    };
    setProfil((prev) => ({
      nama: ambil("NAMA", "nama") ?? prev.nama,
      nim: ambil("NIM", "nim") ?? prev.nim,
      email: ambil("EMAIL", "email") ?? prev.email,
      semester: ambil("SEMESTER", "semester") ?? prev.semester,
      foto: ambil("FOTO", "foto") ?? prev.foto,
    }));
  }, []);

  const [activeTab, setActiveTab] = useState<string>("beranda");
  const [subView, setSubView] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  const [ubahDeadlineVisible, setUbahDeadlineVisible] = useState(false);
  const [kalenderVisible, setKalenderVisible] = useState(false);
  const [statistikVisible, setStatistikVisible] = useState(false);
  const [pendingTasksModalVisible, setPendingTasksModalVisible] = useState(false);
  const [nearestDeadlineModalVisible, setNearestDeadlineModalVisible] = useState(false);

  const [serverStatus, setServerStatus] = useState<string>("Mengecek koneksi...");
  const [customIpInput, setCustomIpInput] = useState<string>(CURRENT_LAN_IP || "");
  const [checkingConn, setCheckingConn] = useState<boolean>(false);

  const [classList, setClassList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [taskFilter, setTaskFilter] = useState<"semua" | "belum" | "selesai">("semua");

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  // Boleh menambah tugas: PJMK Utama / Pendamping di salah satu kelas
  const isPjmkAnyClass =
    classList.some((c) => c.isPjmk) ||
    currentUser.role?.includes("PJMK") ||
    currentUser.role?.toLowerCase() === "admin";

  // [REVISI 2] Sudah jadi PJMK di satu kelas -> tidak boleh membuat kelas lagi
  const kelasPjmkSaya = classList.find((c) => c.isUtama || c.isPendamping);
  const sudahPjmk = !!kelasPjmkSaya;

  // [REVISI 6] Pembungkus jarak atas untuk sub-layar agar tidak menabrak jam / status bar
  const bungkus = (node: React.ReactNode) =>
    TAMBAH_SAFE_AREA_SUBLAYAR ? (
      <View style={{ flex: 1, backgroundColor: COLORS.cardBg, paddingTop: insets.top }}>
        <StatusBar style="dark" />
        {node}
      </View>
    ) : (
      <>
        <StatusBar style="dark" />
        {node}
      </>
    );

  useEffect(() => {
    const onBackPress = () => {
      if (kalenderVisible) {
        setKalenderVisible(false);
        return true;
      }
      if (statistikVisible) {
        setStatistikVisible(false);
        return true;
      }
      if (ubahDeadlineVisible) {
        setUbahDeadlineVisible(false);
        return true;
      }
      if (subView === "form-tugas") {
        setSubView(selectedTask ? "detail-tugas" : "daftar-tugas-kelas");
        return true;
      }
      if (subView === "detail-tugas" || subView === "anggota-kelas") {
        setSubView("daftar-tugas-kelas");
        return true;
      }
      if (
        subView === "daftar-tugas-kelas" ||
        subView === "buat-kelas" ||
        subView === "gabung-kelas"
      ) {
        setSubView(null);
        return true;
      }
      if (activeTab !== "beranda") {
        setActiveTab("beranda");
        return true;
      }

      // Cegah tombol back Android langsung melempar pengguna ke login/registrasi
      Alert.alert(
        "Keluar Aplikasi",
        "Apakah Anda yakin ingin keluar dari akun?",
        [
          { text: "Batal", style: "cancel" },
                    {
            text: "Keluar",
            style: "destructive",
            onPress: () => {
              logout();
            },
          },
        ]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [subView, selectedTask, ubahDeadlineVisible, kalenderVisible, statistikVisible, activeTab]);

  const tasksRef = useRef<any[]>([]);
  tasksRef.current = tasks;

  const jadwalkanPengingat = useCallback(async () => {
    if (!currentUser.userId) return;
    try {
      await sinkronPengingat(tasksRef.current, currentUser.userId);
    } catch (e: any) {
      console.warn("Gagal menjadwalkan pengingat:", e?.message);
    }
  }, [currentUser.userId]);

  useEffect(() => {
    if (loading) return;
    jadwalkanPengingat();
  }, [tasks, loading, jadwalkanPengingat]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const taskId = resp.notification.request.content.data?.taskId;
      const target = tasksRef.current.find((t) => String(t.id) === String(taskId));
      if (target) {
        setSelectedTask(target);
        setSubView("detail-tugas");
      }
    });
    return () => sub.remove();
  }, []);

    // Sinkronkan profil bila data user di AuthContext berubah
  useEffect(() => {
    if (user) terapkanProfil(user);
  }, [user, terapkanProfil]);

  // [REVISI 3] Ambil data profil terbaru dari server (NIM, semester, dll.)
  useEffect(() => {
    if (!currentUser.userId) return;
    (async () => {
      try {
        const data = await fetchProfile(currentUser.userId);
        terapkanProfil(data);
      } catch {}
    })();
  }, [currentUser.userId, terapkanProfil]);

  // [REVISI 1] Teks status koneksi: online / tidak terhubung (tanpa "Mode Offline")
  const verifyConnection = useCallback(async () => {
    try {
      const conn = await checkServerConnection();
      if (conn.ok) {
        setServerStatus(`Online - Terhubung ke Server (${conn.url})`);
      } else {
        setServerStatus(`Server tidak terjangkau (${conn.url})`);
      }
    } catch {
      setServerStatus("Server tidak terjangkau");
    }
  }, []);

  const loadData = useCallback(async (): Promise<any[] | null> => {
    if (!currentUser.userId) return null;
    setLoadError("");
    let freshTasks: any[] | null = null;

    try {
      const serverClasses = await fetchClasses(currentUser.userId);
      const list = Array.isArray(serverClasses) ? serverClasses : [];
      setClassList(list.map((c: any) => mapClass(c, currentUser.userId)));
    } catch (e: any) {
      setLoadError(e?.message || "Gagal memuat daftar kelas.");
    }

    try {
      const serverTasks = await fetchTasks(currentUser.userId);
      const list = Array.isArray(serverTasks) ? serverTasks : [];
      freshTasks = list.map(mapTask);
      setTasks(freshTasks);
    } catch (e: any) {
      setLoadError((prev) => prev || e?.message || "Gagal memuat tugas.");
    }

    try {
      const serverNotifs = await fetchNotifications(currentUser.userId);
      if (Array.isArray(serverNotifs)) {
        const unread = serverNotifs.filter(
          (n: any) => n.IS_READ === 0 || n.is_read === false || !n.is_read
        ).length;
        setUnreadNotifCount(unread);
      }
    } catch {}

    return freshTasks;
  }, [currentUser.userId]);

  useEffect(() => {
    if (!currentUser.userId) return;
    loadData().finally(() => setLoading(false));
    verifyConnection();
  }, [currentUser.userId, loadData, verifyConnection]);

  // [REVISI 5] Setelah daftar kelas diperbarui (misal peran berubah / dicopot),
  // sinkronkan kelas yang sedang dibuka. Jika kelas sudah tidak ada, kembali ke beranda.
  useEffect(() => {
    if (!selectedClass || loading) return;
    const fresh = classList.find(
      (c) => String(c.kelas_id) === String(selectedClass.kelas_id)
    );
    if (fresh) {
      if (
        fresh.role !== selectedClass.role ||
        fresh.members !== selectedClass.members ||
        fresh.activeTasks !== selectedClass.activeTasks
      ) {
        setSelectedClass(fresh);
      }
    } else if (classList.length >= 0 && subView && subView !== "buat-kelas" && subView !== "gabung-kelas") {
      // kelas sudah tidak ada (dihapus / keluar)
      if (subView === "daftar-tugas-kelas" || subView === "anggota-kelas" || subView === "detail-tugas") {
        setSelectedClass(null);
        setSelectedTask(null);
        setSubView(null);
      }
    }
  }, [classList]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await verifyConnection();
    setRefreshing(false);
  };

  const countActiveTasks = (kelasId: any) =>
    tasks.filter(
      (t) => String(t.kelas_id) === String(kelasId) && t.status !== "Selesai"
    ).length;

  const refreshSelectedTask = (freshTasks: any[] | null) => {
    if (!freshTasks || !selectedTask) return;
    const updated = freshTasks.find((t) => String(t.id) === String(selectedTask.id));
    if (updated) setSelectedTask(updated);
  };

  const handleOpenClass = (cls: any) => {
    setSelectedClass(cls);
    setSubView("daftar-tugas-kelas");
  };

  // [REVISI 2] Buka form Buat Kelas hanya jika belum jadi PJMK di kelas lain
  const handleBukaBuatKelas = async () => {
    if (kelasPjmkSaya) {
      Alert.alert(
        "Tidak bisa membuat kelas",
        `Anda sudah menjadi ${kelasPjmkSaya.role} di kelas "${kelasPjmkSaya.name}". Satu akun hanya boleh menjadi PJMK di satu mata kuliah.`
      );
      return;
    }
    try {
      const status: any = await getPjmkStatus(currentUser.userId);
      if (status?.sudah_pjmk) {
        Alert.alert(
          "Tidak bisa membuat kelas",
          `Anda sudah menjadi ${status.peran} di kelas "${status.nama_kelas}". Satu akun hanya boleh menjadi PJMK di satu mata kuliah.`
        );
        return;
      }
    } catch {
      // Jika pengecekan server gagal, backend tetap menolak saat kelas dibuat
    }
    setSubView("buat-kelas");
  };

  const handleCopyClassCode = async (code: string) => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert("Disalin", `Kode kelas "${code}" berhasil disalin.`);
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyalin kode.");
    }
  };

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

  const handleDeleteTask = async (taskId: string | number) => {
    Alert.alert(
      "Hapus Tugas Kelas",
      "Apakah Anda yakin ingin menghapus tugas ini? Tugas akan terhapus dari seluruh jadwal mahasiswa satu kelas.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              // FIX: api.js mewajibkan id pengguna (dikirim sebagai ?oleh=)
              await deleteTask(String(taskId), currentUser.userId);
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

  const handleTaskSaved = async (_savedTask: any) => {
    const fresh = await loadData();
    refreshSelectedTask(fresh);
    setSubView(selectedClass ? "daftar-tugas-kelas" : null);
    setEditingTask(null);
  };

  const handleDeadlineUpdated = async (_updatedTask: any) => {
    const fresh = await loadData();
    refreshSelectedTask(fresh);
    setUbahDeadlineVisible(false);
  };

  const handleClassCreated = async (_newCls: any) => {
    await loadData();
  };

  const handleClassJoined = async (_joinedClass: any) => {
    await loadData();
    setSubView(null);
  };

  const handleSaveCustomIp = async () => {
    if (!customIpInput.trim()) return;
    setCheckingConn(true);
    const newUrl = `http://${customIpInput.trim()}:${BACKEND_PORT}`;
    setCustomBaseUrl(newUrl);
    try {
      const conn = await checkServerConnection();
      if (conn.ok) {
        Alert.alert("Koneksi Berhasil!", `Terhubung ke server di ${newUrl}`);
        setServerStatus(`Online - Terhubung ke Server (${newUrl})`);
        await loadData();
      } else {
        Alert.alert(
          "Gagal Terhubung",
          `Tidak dapat menghubungi ${newUrl}. Periksa koneksi Wi-Fi dan firewall.`
        );
        setServerStatus(`Server tidak terjangkau (${newUrl})`);
      }
    } finally {
      setCheckingConn(false);
    }
  };

    const handleLogout = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
    // Setelah user di-null-kan, _layout.tsx otomatis mengarahkan ke halaman login
    await logout();
  };

  if (!currentUser.userId) {
    return null;
  }

  // 1. Sub-View: Daftar Tugas Kelas
  if (subView === "daftar-tugas-kelas" && selectedClass) {
    const classTasks = tasks.filter(
      (t) => String(t.kelas_id) === String(selectedClass.kelas_id)
    );

    return bungkus(
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
    return bungkus(
      <View style={{ flex: 1 }}>
        <DetailTugasComp
          task={selectedTask}
          currentUser={currentUser}
          onBack={() => setSubView(selectedClass ? "daftar-tugas-kelas" : null)}
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
  //    onChanged: dipanggil layar anggota setelah peran berubah / PJMK Pendamping dicopot /
  //    anggota keluar, supaya daftar kelas di dashboard ikut diperbarui.
  if (subView === "anggota-kelas" && selectedClass) {
    return bungkus(
      <AnggotaKelasComp
        kelas={selectedClass}
        currentUser={currentUser}
        onBack={() => setSubView("daftar-tugas-kelas")}
        onChanged={loadData}
      />
    );
  }

  // 4. Sub-View: Buat Kelas (PJMK)
  if (subView === "buat-kelas") {
    return bungkus(
      <BuatKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassCreated={handleClassCreated}
      />
    );
  }

  // 5. Sub-View: Gabung Kelas
  if (subView === "gabung-kelas") {
    return bungkus(
      <GabungKelasComp
        currentUser={currentUser}
        onBack={() => setSubView(null)}
        onClassJoined={handleClassJoined}
      />
    );
  }

  // 6. Sub-View: Form Tambah / Ubah Tugas (PJMK)
  if (subView === "form-tugas") {
    const targetClass =
      selectedClass ||
      classList.find((c) => c.isPjmk) ||
      classList[0] || {
        kelas_id: "default",
        name: "Kelas Utama",
      };

    return bungkus(
      <FormTugasComp
        task={editingTask}
        kelas={targetClass}
        currentUser={currentUser}
        onBack={() => setSubView(selectedTask ? "detail-tugas" : (selectedClass ? "daftar-tugas-kelas" : null))}
        onTaskSaved={handleTaskSaved}
      />
    );
  }

  // Perhitungan statistik tugas
  const unfinishedTasks = tasks.filter((t) => t.status !== "Selesai");
  const finishedTasks = tasks.filter((t) => t.status === "Selesai");

  // Tugas deadline terdekat
  const sortedPendingTasks = [...unfinishedTasks].sort((a, b) => {
    const timeA = a.deadlineRaw ? new Date(a.deadlineRaw).getTime() : Infinity;
    const timeB = b.deadlineRaw ? new Date(b.deadlineRaw).getTime() : Infinity;
    return timeA - timeB;
  });
  const nearestTask = sortedPendingTasks[0];
  const nearestLabelHari = nearestTask ? hitungLabelHari(nearestTask.deadlineRaw) : "";

  // Filter tugas untuk bagian "Tugas Mendatang"
  const displayedTasks =
    taskFilter === "belum"
      ? unfinishedTasks
      : taskFilter === "selesai"
      ? finishedTasks
      : tasks;

  // Daftar kalender diurutkan sesuai tenggat yang diinput
  const calendarTasks = [...tasks].sort((a, b) => {
    const timeA = a.deadlineRaw ? new Date(a.deadlineRaw).getTime() : Infinity;
    const timeB = b.deadlineRaw ? new Date(b.deadlineRaw).getTime() : Infinity;
    return timeA - timeB;
  });

  const bottomSpace = Math.max(insets.bottom, 8) + 70;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <StatusBar style="dark" />

      {/* HEADER ATAS */}
      <View style={styles.topHeader}>
        <View style={styles.headerBrandBox}>
          <Text style={styles.appBrand}>Tasky</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "catatan"
              ? "Catatan Pribadi"
              : activeTab === "notifikasi"
              ? "Notifikasi"
              : activeTab === "profil"
              ? "Profil Mahasiswa"
              : "Kelas / Tugas"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => setActiveTab("profil")}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            {currentUser.foto ? (
              <Image
                source={{ uri: currentUser.foto }}
                style={{ width: "100%", height: "100%", borderRadius: 18 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {(currentUser.nama || "D").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* KONTEN UTAMA BERDASARKAN TAB */}
      {activeTab === "catatan" ? (
        <CatatanComp currentUser={currentUser} activeClass={classList[0]} />
      ) : activeTab === "notifikasi" ? (
        <NotifikasiComp
          currentUser={currentUser}
          onOpenTask={(taskId: any) => {
            const target = tasks.find((t) => String(t.id) === String(taskId));
            if (target) {
              setSelectedTask(target);
              setSubView("detail-tugas");
            }
          }}
        />
      ) : activeTab === "profil" ? (
        <ProfilComp
          currentUser={currentUser}
          serverStatus={serverStatus}
          ipValue={customIpInput}
          onChangeIp={setCustomIpInput}
          onSaveIp={handleSaveCustomIp}
          checking={checkingConn}
          backendPort={BACKEND_PORT}
          onLogout={handleLogout}
          bottomSpace={bottomSpace}
          onProfileUpdated={terapkanProfil}
        />
      ) : (
        /* ================= TAB BERANDA / DAFTAR KELAS ================= */
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: bottomSpace + 30,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {loadError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : null}

          {/* GREETING CARD */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingTitle}>
                Halo, {currentUser.nama}!
              </Text>
              <View style={styles.nimRow}>
                <Text style={styles.nimText}>
                  NIM : {currentUser.nim || "-"}
                  {currentUser.semester ? (
                    <Text>
                      {" "}• <Text style={styles.semesterTag}>Smt {currentUser.semester}</Text>
                    </Text>
                  ) : null}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.greetingAvatarBox}
              onPress={() => setActiveTab("profil")}
              activeOpacity={0.8}
            >
              <View style={styles.greetingAvatar}>
                {currentUser.foto ? (
                  <Image
                    source={{ uri: currentUser.foto }}
                    style={{ width: "100%", height: "100%", borderRadius: 24 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.greetingAvatarText}>
                    {(currentUser.nama || "D").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* DUA KARTU AKSI CEPAT: [ BUAT KELAS ] & [ GABUNG KELAS ] */}
          <View style={styles.quickActionRow}>
            {/* BUAT KELAS (PJMK) - dikunci jika sudah jadi PJMK di kelas lain */}
            <TouchableOpacity
              style={[styles.actionCardPrimary, sudahPjmk && styles.actionCardDisabled]}
              onPress={handleBukaBuatKelas}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconCirclePrimary}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionCardTitlePrimary}>Buat Kelas</Text>
              <Text style={styles.actionCardSubtitlePrimary}>
                {sudahPjmk ? "Sudah jadi PJMK" : "Khusus PJMK / Admin"}
              </Text>
            </TouchableOpacity>

            {/* GABUNG KELAS */}
            <TouchableOpacity
              style={styles.actionCardSecondary}
              onPress={() => setSubView("gabung-kelas")}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconCircleSecondary}>
                <Ionicons name="enter-outline" size={18} color="#0047BA" />
              </View>
              <Text style={styles.actionCardTitleSecondary}>Gabung Kelas</Text>
              <Text style={styles.actionCardSubtitleSecondary}>
                Pakai Kode Undangan
              </Text>
            </TouchableOpacity>
          </View>

          {/* RINGKASAN TUGAS & DEADLINE CEPAT */}
          <View style={styles.statsRow}>
            {/* KARTU 1: TUGAS BELUM SELESAI (REVISI 8: KLIK UNTUK LIHAT DAFTAR & SOLUSI) */}
            <TouchableOpacity
              style={styles.statCardLeft}
              onPress={() => setPendingTasksModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.statHeaderRow}>
                <View style={styles.statIconBoxBlue}>
                  <Text style={styles.statIconEmoji}>Tugas</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Buka Solusi</Text>
                </View>
              </View>
              <Text style={styles.statCardSubtitle}>Tugas Belum Selesai</Text>
              <Text style={styles.statCardBigNumber}>
                {unfinishedTasks.length} <Text style={styles.statCardSmallText}>Tugas</Text>
              </Text>
            </TouchableOpacity>

            {/* KARTU 2: DEADLINE TERDEKAT (REVISI 8: KLIK UNTUK REAL-TIME COUNTDOWN DETIK) */}
            <TouchableOpacity
              style={styles.statCardRight}
              onPress={() => setNearestDeadlineModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.statHeaderRow}>
                <View style={styles.statIconBoxOrange}>
                  <Text style={styles.statIconEmoji}>Batas</Text>
                </View>
                {nearestLabelHari ? (
                  <View style={styles.h1Pill}>
                    <Text style={styles.h1PillText}>{nearestLabelHari}</Text>
                  </View>
                ) : (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Live Detik</Text>
                  </View>
                )}
              </View>
              <Text style={styles.statCardSubtitle}>Deadline Terdekat</Text>
              <Text
                style={styles.statCardNearTask}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {nearestTask ? nearestTask.subject : "Semua Selesai"}
              </Text>
              <Text style={styles.statCardNearTime}>
                {nearestTask ? nearestTask.countdown || nearestTask.deadline : "Tidak ada tugas"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TOMBOL FITUR TAMBAHAN: KALENDER DEADLINE & STATISTIK SAYA */}
          <View style={styles.featurePillsRow}>
            <TouchableOpacity
              style={styles.featurePill}
              onPress={() => setKalenderVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.featurePillText}>Kalender Deadline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featurePill}
              onPress={() => setStatistikVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.featurePillText}>Statistik Akademik</Text>
            </TouchableOpacity>
          </View>

          {/* ================= SECTION KELAS TERDAFTAR ================= */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Kelas Terdaftar ({classList.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (classList.length > 0) {
                  Alert.alert(
                    "Kelola Kelas",
                    "Pilih salah satu kelas di bawah untuk melihat tugas atau anggota."
                  );
                } else {
                  setSubView("gabung-kelas");
                }
              }}
            >
              <Text style={styles.sectionLink}>Kelola ›</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primaryBlue}
              style={{ marginVertical: 24 }}
            />
          ) : classList.length === 0 ? (
            /* EMPTY STATE MAHASISWA BARU (0 KELAS) */
            <View style={styles.emptyClassCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyEmoji}>KELAS</Text>
              </View>
              <Text style={styles.emptyTitle}>Belum Terdaftar di Kelas Manapun</Text>
              <Text style={styles.emptyDesc}>
                Sebagai mahasiswa baru, Anda belum masuk ke kelas manapun. Buat kelas baru untuk menjadi PJMK atau masukkan kode kelas dari PJMK Anda untuk bergabung.
              </Text>
              <View style={styles.emptyActionRow}>
                <TouchableOpacity
                  style={styles.emptyPrimaryBtn}
                  onPress={handleBukaBuatKelas}
                >
                  <Text style={styles.emptyPrimaryBtnText}>+ Buat Kelas Baru</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emptySecondaryBtn}
                  onPress={() => setSubView("gabung-kelas")}
                >
                  <Text style={styles.emptySecondaryBtnText}>Gabung Kelas</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* DAFTAR KELAS */
            classList.map((cls, idx) => {
              const activeCount = countActiveTasks(cls.kelas_id);

              return (
                <TouchableOpacity
                  key={String(cls.kelas_id ?? idx)}
                  style={styles.classCard}
                  onPress={() => handleOpenClass(cls)}
                  activeOpacity={0.9}
                >
                  {/* BARIS ATAS KARTU KELAS: BADGE PERAN & CHIP KODE */}
                  <View style={styles.classCardTopRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        cls.isUtama
                          ? styles.roleBadgePjmk
                          : cls.isPendamping
                          ? styles.roleBadgePendamping
                          : styles.roleBadgeMhs,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          cls.isUtama
                            ? styles.roleBadgeTextPjmk
                            : cls.isPendamping
                            ? styles.roleBadgeTextPendamping
                            : styles.roleBadgeTextMhs,
                        ]}
                      >
                        {cls.role}
                      </Text>
                    </View>

                    {cls.code ? (
                      <TouchableOpacity
                        style={styles.codeChip}
                        onPress={() => handleCopyClassCode(cls.code)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.codeChipText}>
                          Kode: {cls.code}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.menuDots}
                      onPress={() => handleOpenClass(cls)}
                    >
                      <Text style={styles.menuDotsText}>⋮</Text>
                    </TouchableOpacity>
                  </View>

                  {/* NAMA KELAS (& RUANGAN jika ada di data) */}
                  <Text
                    style={[styles.className, !cls.room && { marginBottom: 12 }]}
                  >
                    {cls.name || "Kelas Tanpa Nama"}
                  </Text>
                  {cls.room ? <Text style={styles.classRoom}>{cls.room}</Text> : null}

                  {/* FOOTER KARTU KELAS */}
                  <View style={styles.classCardFooter}>
                    <View style={styles.classMetaRow}>
                      <Text style={styles.matkulMeta}>
                        {cls.members} Anggota
                      </Text>
                      <View
                        style={[
                          styles.activeTaskBadge,
                          activeCount > 0 && styles.activeTaskBadgeHighlight,
                        ]}
                      >
                        <Text
                          style={[
                            styles.activeTaskText,
                            activeCount > 0 && styles.activeTaskTextHighlight,
                          ]}
                        >
                          {activeCount} Tugas Aktif
                        </Text>
                      </View>
                    </View>

                    <View style={styles.openLinkBox}>
                      <Text style={styles.openLinkText}>Buka →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ================= SECTION TUGAS MENDATANG ================= */}
          <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>Tugas Mendatang</Text>
            <Text style={styles.sortSubtitle}>Urut Deadline</Text>
          </View>

          {/* TABS FILTER TUGAS */}
          <View style={styles.taskFilterRow}>
            <TouchableOpacity
              style={[
                styles.taskFilterPill,
                taskFilter === "semua" && styles.taskFilterPillActive,
              ]}
              onPress={() => setTaskFilter("semua")}
            >
              <Text
                style={[
                  styles.taskFilterPillText,
                  taskFilter === "semua" && styles.taskFilterPillTextActive,
                ]}
              >
                Semua ({tasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilterPill,
                taskFilter === "belum" && styles.taskFilterPillActive,
              ]}
              onPress={() => setTaskFilter("belum")}
            >
              <Text
                style={[
                  styles.taskFilterPillText,
                  taskFilter === "belum" && styles.taskFilterPillTextActive,
                ]}
              >
                Belum Dikerjakan ({unfinishedTasks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilterPill,
                taskFilter === "selesai" && styles.taskFilterPillActive,
              ]}
              onPress={() => setTaskFilter("selesai")}
            >
              <Text
                style={[
                  styles.taskFilterPillText,
                  taskFilter === "selesai" && styles.taskFilterPillTextActive,
                ]}
              >
                Selesai ({finishedTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* DAFTAR TUGAS */}
          {displayedTasks.length === 0 ? (
            <View style={styles.emptyTaskCard}>
              <Text style={styles.emptyTaskTitle}>
                {taskFilter === "selesai"
                  ? "Belum ada tugas selesai"
                  : taskFilter === "belum"
                  ? "Semua tugas telah diselesaikan"
                  : "Belum ada tugas di kelas Anda"}
              </Text>
            </View>
          ) : (
            displayedTasks.map((t, idx) => {
              const isFinished = t.status === "Selesai";
              return (
                <TouchableOpacity
                  key={String(t.id ?? idx)}
                  style={[
                    styles.taskCard,
                    isFinished && styles.taskCardFinished,
                  ]}
                  onPress={() => {
                    setSelectedTask(t);
                    setSubView("detail-tugas");
                  }}
                  activeOpacity={0.9}
                >
                  {/* BARIS HEADER TUGAS: COUNTDOWN & BADGE MATA KULIAH */}
                  <View style={styles.taskCardTopRow}>
                    <View
                      style={[
                        styles.taskCountdownPill,
                        isFinished && styles.taskCountdownPillFinished,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskCountdownText,
                          isFinished && styles.taskCountdownTextFinished,
                        ]}
                      >
                        {isFinished
                          ? "Selesai"
                          : t.countdown || t.deadline}
                      </Text>
                    </View>

                    <View style={styles.taskSubjectPill}>
                      <Text style={styles.taskSubjectPillText}>
                        {t.subject}
                      </Text>
                    </View>
                  </View>

                  {/* JUDUL TUGAS & CHECKBOX STATUS */}
                  <View style={styles.taskTitleRow}>
                    <Text
                      style={[
                        styles.taskTitleText,
                        isFinished && styles.taskTitleTextFinished,
                      ]}
                      numberOfLines={2}
                    >
                      {t.title}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.checkboxBox,
                        isFinished && styles.checkboxBoxChecked,
                      ]}
                      onPress={() =>
                        handleToggleTaskStatus(
                          t.id,
                          isFinished ? "Belum Dikerjakan" : "Selesai"
                        )
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {isFinished ? (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  </View>

                  {/* INFO PEMBUAT & TENGGAT SESUAI INPUT */}
                  <Text style={styles.taskCreatorText}>
                    {t.creator}
                  </Text>
                  <Text style={styles.taskDeadlineText}>
                    Tenggat: {t.deadline}
                  </Text>

                  {/* FOOTER TUGAS: STATUS BADGE */}
                  <View style={styles.taskFooterRow}>
                    <View
                      style={[
                        styles.taskStatusPill,
                        isFinished
                          ? styles.taskStatusPillSuccess
                          : styles.taskStatusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusPillText,
                          isFinished
                            ? styles.taskStatusPillTextSuccess
                            : styles.taskStatusPillTextPending,
                        ]}
                      >
                        {t.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* [REVISI 1] Banner online (menggantikan teks "data lokal / jaringan pulih") */}
          <View style={styles.bottomSyncCard}>
            <View style={styles.bottomSyncIconBox}>
              <Ionicons name="cloud-done-outline" size={20} color="#0047BA" />
            </View>
            <View style={styles.bottomSyncContent}>
              <Text style={styles.bottomSyncTitle}>Sinkronisasi Online</Text>
              <Text style={styles.bottomSyncDesc}>
                Tugas & progres Anda tersimpan langsung ke server. Tarik layar ke bawah untuk memuat data terbaru.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* FLOATING ACTION BUTTON (FAB) KHUSUS PJMK */}
      {activeTab === "beranda" && !subView && isPjmkAnyClass ? (
        <View style={[styles.fabContainer, { bottom: bottomSpace + 12 }]}>
          <View style={styles.fabPjmkBadge}>
            <Text style={styles.fabPjmkBadgeText}>Khusus PJMK</Text>
          </View>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => {
              setEditingTask(null);
              setSubView("form-tugas");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.fabBtnIcon}>+</Text>
            <Text style={styles.fabBtnText}>Tambah Tugas</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* BOTTOM NAVIGATION */}
      <View
        style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        {TABS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => {
                setSubView(null);
                setActiveTab(item.key);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.navIconBox}>
                <Ionicons
                  name={isActive ? (item.iconFilled as any) : (item.iconOutline as any)}
                  size={22}
                  color={isActive ? "#0047BA" : "#64748B"}
                />
                {item.key === "notifikasi" && unreadNotifCount > 0 ? (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MODAL KALENDER DEADLINE (tanggal & jam dari tenggat yang diinput, terurut) */}
      <Modal
        visible={kalenderVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setKalenderVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kalender Deadline</Text>
              <TouchableOpacity
                onPress={() => setKalenderVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.calendarSubtitle}>
                Daftar tenggat waktu tugas kuliah, diurutkan dari yang terdekat:
              </Text>

              {calendarTasks.length === 0 ? (
                <Text style={styles.calendarEmptyText}>
                  Belum ada tugas dengan tenggat waktu.
                </Text>
              ) : (
                calendarTasks.map((t, idx) => (
                  <View key={String(t.id ?? idx)} style={styles.calendarItem}>
                    <View style={styles.calendarDateBox}>
                      <Text style={styles.calendarDateText}>
                        {formatTanggalSaja(t.deadlineRaw)}
                      </Text>
                      <Text style={styles.calendarTimeText}>
                        {formatJamSaja(t.deadlineRaw)}
                      </Text>
                    </View>
                    <View style={styles.calendarItemInfo}>
                      <Text style={styles.calendarItemTitle}>{t.title}</Text>
                      <Text style={styles.calendarItemSubject}>{t.subject}</Text>
                      <Text style={styles.calendarItemCountdown}>
                        {t.status === "Selesai" ? "Selesai" : t.countdown || t.deadline}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setKalenderVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Tutup Kalender</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL STATISTIK SAYA */}
      <Modal
        visible={statistikVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatistikVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Statistik Akademik</Text>
              <TouchableOpacity
                onPress={() => setStatistikVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.statModalCard}>
                <Text style={styles.statModalLabel}>Tingkat Penyelesaian Tugas</Text>
                <Text style={styles.statModalPercentage}>
                  {tasks.length > 0
                    ? Math.round((finishedTasks.length / tasks.length) * 100)
                    : 0}
                  %
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          tasks.length > 0
                            ? Math.round((finishedTasks.length / tasks.length) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statNumbersRow}>
                <View style={styles.statNumberBox}>
                  <Text style={styles.statNumberVal}>{classList.length}</Text>
                  <Text style={styles.statNumberSub}>Kelas Diikuti</Text>
                </View>

                <View style={styles.statNumberBox}>
                  <Text style={styles.statNumberVal}>{unfinishedTasks.length}</Text>
                  <Text style={styles.statNumberSub}>Belum Selesai</Text>
                </View>

                <View style={styles.statNumberBox}>
                  <Text style={styles.statNumberVal}>{finishedTasks.length}</Text>
                  <Text style={styles.statNumberSub}>Tugas Selesai</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setStatistikVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Tutup Statistik</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REVISI 8: MODAL TUGAS BELUM SELESAI DENGAN TIPS & CHECKLIST */}
      <PendingTasksComp
        visible={pendingTasksModalVisible}
        tasks={unfinishedTasks}
        onClose={() => setPendingTasksModalVisible(false)}
        onOpenTask={(t: any) => {
          setSelectedTask(t);
          setSubView("detail-tugas");
        }}
        onToggleTask={(taskId: any, nextStatus: string) => {
          handleToggleTaskStatus(taskId, nextStatus);
        }}
      />

      {/* REVISI 8: MODAL DEADLINE TERDEKAT DENGAN REAL-TIME TICKING SECONDS COUNTDOWN */}
      <NearestDeadlineComp
        visible={nearestDeadlineModalVisible}
        task={nearestTask}
        onClose={() => setNearestDeadlineModalVisible(false)}
        onOpenTask={(t: any) => {
          setSelectedTask(t);
          setSubView("detail-tugas");
        }}
        onToggleTask={(taskId: any, nextStatus: string) => {
          handleToggleTaskStatus(taskId, nextStatus);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrandBox: {
    flexDirection: "column",
  },
  appBrand: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primaryBlue,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.subText,
    marginTop: 1,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lightBlueBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BAE0FD",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primaryBlue,
  },
  scrollArea: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: COLORS.urgentBadge,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.urgentText,
    fontSize: 13,
    fontWeight: "600",
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
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.navyText,
    marginBottom: 4,
  },
  nimRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nimIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  nimText: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: "600",
  },
  semesterTag: {
    color: COLORS.primaryBlue,
    fontWeight: "800",
  },
  greetingAvatarBox: {
    position: "relative",
  },
  greetingAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0EFFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BAE0FD",
  },
  greetingAvatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primaryBlue,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 2,
    elevation: 2,
  },
  cameraIcon: {
    fontSize: 11,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  actionCardPrimary: {
    flex: 1,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionCardDisabled: {
    opacity: 0.55,
  },
  actionIconCirclePrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionEmojiPrimary: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  actionCardTitlePrimary: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  actionCardSubtitlePrimary: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  actionCardSecondary: {
    flex: 1,
    backgroundColor: COLORS.lightBlueBg,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#BAE0FD",
  },
  actionIconCircleSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionEmojiSecondary: {
    fontSize: 14,
  },
  actionCardTitleSecondary: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.navyText,
    marginBottom: 2,
  },
  actionCardSubtitleSecondary: {
    fontSize: 11,
    color: COLORS.subText,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statCardLeft: {
    flex: 1,
    backgroundColor: COLORS.lightBlueCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  statCardRight: {
    flex: 1,
    backgroundColor: "#FEF7EE",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  statHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statIconBoxBlue: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBoxOrange: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconEmoji: {
    fontSize: 13,
  },
  activePill: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  h1Pill: {
    backgroundColor: "#F97316",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  h1PillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statCardSubtitle: {
    fontSize: 11,
    color: COLORS.subText,
    fontWeight: "600",
    marginBottom: 2,
  },
  statCardBigNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navyText,
  },
  statCardSmallText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.subText,
  },
  statCardNearTask: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.navyText,
  },
  statCardNearTime: {
    fontSize: 10,
    color: COLORS.urgentText,
    fontWeight: "700",
    marginTop: 2,
  },
  featurePillsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  featurePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featurePillIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.navyText,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.navyText,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryBlue,
  },
  emptyClassCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightBlueCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.navyText,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.subText,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  emptyPrimaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  emptyPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptySecondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.lightBlueCard,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  emptySecondaryBtnText: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: "700",
  },
  classCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  classCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  roleBadgePjmk: {
    backgroundColor: COLORS.primaryBlue,
  },
  roleBadgePendamping: {
    backgroundColor: COLORS.purpleBg,
  },
  roleBadgeMhs: {
    backgroundColor: "#F1F5F9",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  roleBadgeTextPjmk: {
    color: "#FFFFFF",
  },
  roleBadgeTextPendamping: {
    color: COLORS.purpleText,
  },
  roleBadgeTextMhs: {
    color: "#334155",
  },
  codeChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.navyText,
  },
  menuDots: {
    marginLeft: "auto",
    paddingHorizontal: 8,
  },
  menuDotsText: {
    fontSize: 16,
    color: COLORS.subText,
    fontWeight: "bold",
  },
  className: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.navyText,
    marginBottom: 2,
  },
  classRoom: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 12,
  },
  classCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  classMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  matkulMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.navyText,
  },
  activeTaskBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTaskBadgeHighlight: {
    backgroundColor: "#EFF6FF",
  },
  activeTaskText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.subText,
  },
  activeTaskTextHighlight: {
    color: COLORS.primaryBlue,
  },
  openLinkBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  openLinkText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryBlue,
  },
  sortSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.subText,
  },
  taskFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  taskFilterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskFilterPillActive: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  taskFilterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.subText,
  },
  taskFilterPillTextActive: {
    color: "#FFFFFF",
  },
  emptyTaskCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTaskTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.subText,
  },
  taskCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryBlue,
  },
  taskCardFinished: {
    borderLeftColor: COLORS.successText,
    opacity: 0.85,
  },
  taskCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskCountdownPill: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskCountdownPillFinished: {
    backgroundColor: COLORS.successBg,
  },
  taskCountdownText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.urgentText,
  },
  taskCountdownTextFinished: {
    color: COLORS.successText,
  },
  taskSubjectPill: {
    backgroundColor: COLORS.lightBlueCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskSubjectPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryBlue,
  },
  taskTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskTitleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.navyText,
    marginRight: 10,
  },
  taskTitleTextFinished: {
    textDecorationLine: "line-through",
    color: COLORS.subText,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  checkboxCheck: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  taskCreatorText: {
    fontSize: 11,
    color: COLORS.subText,
    marginBottom: 4,
  },
  taskDeadlineText: {
    fontSize: 11,
    color: COLORS.subText,
    fontWeight: "600",
    marginBottom: 10,
  },
  taskFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  taskStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskStatusPillPending: {
    backgroundColor: "#F1F5F9",
  },
  taskStatusPillSuccess: {
    backgroundColor: COLORS.successBg,
  },
  taskStatusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  taskStatusPillTextPending: {
    color: COLORS.subText,
  },
  taskStatusPillTextSuccess: {
    color: COLORS.successText,
  },
  bottomSyncCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  bottomSyncIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bottomSyncEmoji: {
    fontSize: 16,
  },
  bottomSyncContent: {
    flex: 1,
  },
  bottomSyncTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navyText,
    marginBottom: 2,
  },
  bottomSyncDesc: {
    fontSize: 11,
    color: COLORS.subText,
    lineHeight: 16,
  },
  fabContainer: {
    position: "absolute",
    right: 18,
    alignItems: "center",
  },
  fabPjmkBadge: {
    backgroundColor: COLORS.navyText,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  fabPjmkBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  fabBtn: {
    backgroundColor: COLORS.primaryBlue,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 6,
  },
  fabBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  navIconBox: {
    position: "relative",
    marginBottom: 2,
  },
  navIconEmoji: {
    fontSize: 18,
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: COLORS.urgentText,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  navText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.subText,
  },
  navTextActive: {
    color: COLORS.primaryBlue,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navyText,
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.subText,
    fontWeight: "bold",
    padding: 8,
  },
  calendarSubtitle: {
    fontSize: 13,
    color: COLORS.subText,
    marginBottom: 14,
  },
  calendarEmptyText: {
    fontSize: 13,
    color: COLORS.subText,
    textAlign: "center",
    marginVertical: 20,
  },
  calendarItem: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  calendarDateBox: {
    backgroundColor: COLORS.lightBlueCard,
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    minWidth: 80,
    alignItems: "center",
  },
  calendarDateText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryBlue,
    textAlign: "center",
  },
  calendarTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.subText,
    marginTop: 2,
  },
  calendarItemInfo: {
    flex: 1,
  },
  calendarItemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.navyText,
    marginBottom: 2,
  },
  calendarItemSubject: {
    fontSize: 12,
    color: COLORS.subText,
  },
  calendarItemCountdown: {
    fontSize: 11,
    color: COLORS.urgentText,
    fontWeight: "700",
    marginTop: 2,
  },
  statModalCard: {
    backgroundColor: COLORS.lightBlueCard,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  statModalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.subText,
    marginBottom: 6,
  },
  statModalPercentage: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.primaryBlue,
    marginBottom: 10,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#DBEAFE",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 4,
  },
  statNumbersRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statNumberBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNumberVal: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.navyText,
    marginBottom: 2,
  },
  statNumberSub: {
    fontSize: 10,
    color: COLORS.subText,
    fontWeight: "600",
    textAlign: "center",
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  modalCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});