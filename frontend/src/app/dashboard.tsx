import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const COLORS = {
  background: "#F1F9FF",
  blue: "#124DA8",
  lightBlue: "#D9F1FF",
  text: "#102F3A",
  muted: "#5D6572",
  white: "#FFFFFF",
  orange: "#FFB632",
  border: "#E5EEF5",
};

const classes = [
  {
    code: "BDA-2024",
    name: "Basis Data A",
    room: "Lab Komputer Terpadu 3",
    role: "PJMK",
    members: 42,
    activeTasks: 2,
  },
  {
    code: "SOB-771",
    name: "Sistem Operasi B",
    room: "Gedung Kuliah Bersama",
    role: "",
    members: 38,
    activeTasks: 2,
  },
];

const initialTasks = [
  {
    id: 1,
    subject: "Basis Data A",
    title: "Normalisasi ERD & Skema Relasional",
    deadline: "Besok, 23:59 WIB",
    countdown: "H-1",
    creator: "Dibuat oleh PJMK (Anda) • Tugas Individu",
    attachment: "PDF / Dokumen",
    status: "Belum Dikerjakan",
    color: "#FFB632",
  },
  {
    id: 2,
    subject: "Sistem Operasi B",
    title: "Simulasi Algoritma Scheduling CPU",
    deadline: "Kamis, 23:59 WIB",
    countdown: "H-3",
    creator: "PJMK: Dimas Aditya • Kelompok (3 org)",
    attachment: "Source Code (C/Java)",
    status: "Belum Dikerjakan",
    color: "#4D9BFF",
  },
  {
    id: 3,
    subject: "Algoritma Pemrograman",
    title: "Implementasi Binary Search Tree di C++",
    deadline: "Sabtu, 17:00 WIB",
    countdown: "H-5",
    creator: "Praktikum Mandiri Bab 8",
    attachment: "GitHub Repo Link",
    status: "Belum Dikerjakan",
    color: "#BFC5D2",
  },
  {
    id: 4,
    subject: "Kecerdasan Buatan",
    title: "Mini Paper Review Machine Learning",
    deadline: "Dikirim Kemarin",
    countdown: "",
    creator: "Nilai telah diunggah Dosen",
    attachment: "Lihat Nilai",
    status: "Selesai",
    color: COLORS.blue,
  },
];

export default function Dashboard() {
  const { nama, nim, email } = useLocalSearchParams();

  const namaPengguna = typeof nama === "string" ? nama : "Mahasiswa";

  const inisial = namaPengguna.trim().charAt(0).toUpperCase() || "U";
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("Semua");

  const unfinishedCount = tasks.filter(
    (task) => task.status !== "Selesai",
  ).length;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "Belum Dikerjakan") {
      return task.status !== "Selesai";
    }

    if (filter === "Selesai") {
      return task.status === "Selesai";
    }

    return true;
  });

  function toggleTask(taskId: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status:
                task.status === "Selesai" ? "Belum Dikerjakan" : "Selesai",
            }
          : task,
      ),
    );
  }

  function showComingSoon(page: string) {
    Alert.alert(page, "Halaman ini akan kita buat pada tahap berikutnya.");
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beranda</Text>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.avatar}
            onPress={() => showComingSoon("Profil")}
          >
            <Text style={styles.avatarText}>{inisial}</Text>
          </Pressable>

          <Pressable
            style={styles.searchButton}
            onPress={() => showComingSoon("Pencarian")}
          >
            <Text style={styles.searchIcon}>⌕</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Halo, {namaPengguna}!</Text>
        <Text style={styles.greetingSubtitle}>
          Siap mengatur tugas kuliah hari ini?
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* RINGKASAN */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.iconSquare}>
              <Text style={styles.summaryIcon}>▤</Text>
            </View>

            <Text style={styles.summaryLabel}>Tugas Belum Selesai</Text>

            <Text style={styles.summaryNumber}>
              {unfinishedCount} <Text style={styles.summaryUnit}>Tugas</Text>
            </Text>

            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Aktif</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.iconSquare, styles.orangeSquare]}>
              <Text style={styles.summaryIcon}>◷</Text>
            </View>

            <Text style={styles.summaryLabel}>Deadline Terdekat</Text>

            <Text style={styles.deadlineSubject}>Basis Data Praktikum</Text>

            <Text style={styles.deadlineText}>◷ Besok, 23:59 WIB</Text>

            <View style={styles.deadlineBadge}>
              <Text style={styles.deadlineBadgeText}>H-1</Text>
            </View>
          </View>
        </View>

        {/* KELAS SAYA */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Kelas Saya</Text>
            <Text style={styles.countBadge}>2</Text>
          </View>

          <Pressable onPress={() => showComingSoon("Daftar Kelas")}>
            <Text style={styles.linkText}>Lihat Semua ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classList}
        >
          {classes.map((item) => (
            <Pressable
              key={item.code}
              style={styles.classCard}
              onPress={() => showComingSoon(`Kelas ${item.name}`)}
            >
              <View style={styles.classTopRow}>
                <Text style={styles.classCode}>{item.code}</Text>

                {item.role ? (
                  <Text style={styles.roleBadge}>★ {item.role}</Text>
                ) : null}
              </View>

              <Text style={styles.className}>{item.name}</Text>

              <Text style={styles.classRoom}>{item.room}</Text>

              <View style={styles.classFooter}>
                <Text style={styles.memberText}>♙ {item.members} Mhs</Text>

                <Text style={styles.taskCountBadge}>
                  {item.activeTasks} Tugas Aktif
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* TUGAS MENDATANG */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tugas Mendatang</Text>

          <Text style={styles.sortText}>Urut Deadline</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {["Semua", "Belum Dikerjakan", "Selesai"].map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterButton,
                filter === item && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item === "Semua"
                  ? `Semua (${tasks.length})`
                  : item === "Belum Dikerjakan"
                    ? `Belum Dikerjakan (${unfinishedCount})`
                    : `Selesai (${tasks.length - unfinishedCount})`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* DAFTAR KARTU TUGAS */}
        {filteredTasks.map((task) => {
          const isDone = task.status === "Selesai";

          return (
            <View key={task.id} style={styles.taskCard}>
              <View
                style={[styles.taskAccent, { backgroundColor: task.color }]}
              />

              <View style={styles.taskContent}>
                <View style={styles.taskTopRow}>
                  <Text style={styles.taskDeadlineBadge}>
                    {task.countdown
                      ? `⌛ ${task.countdown} • ${task.deadline}`
                      : task.deadline}
                  </Text>

                  <Text style={styles.subjectBadge}>{task.subject}</Text>
                </View>

                <View style={styles.taskTitleRow}>
                  <Text
                    style={[styles.taskTitle, isDone && styles.completedTitle]}
                  >
                    {task.title}
                  </Text>

                  <Pressable
                    style={[
                      styles.checkButton,
                      isDone && styles.checkButtonDone,
                    ]}
                    onPress={() => toggleTask(task.id)}
                  >
                    {isDone ? <Text style={styles.checkMark}>✓</Text> : null}
                  </Pressable>
                </View>

                <Text style={styles.taskCreator}>{task.creator}</Text>

                <View style={styles.taskBottomRow}>
                  <Text
                    style={[styles.statusBadge, isDone && styles.statusDone]}
                  >
                    {isDone ? "✓ Selesai" : "◉ Belum Dikerjakan"}
                  </Text>

                  <Text style={styles.attachmentText}>{task.attachment}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Tidak ada tugas</Text>
            <Text style={styles.emptyText}>
              Belum ada tugas dalam kategori ini.
            </Text>
          </View>
        )}

        {/* TOMBOL TAMBAH TUGAS */}
        <Pressable
          style={styles.addTaskButton}
          onPress={() => showComingSoon("Tambah Tugas")}
        >
          <Text style={styles.addTaskText}>＋ Tambah Tugas</Text>
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* NAVIGASI BAWAH */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>☷</Text>
          <Text style={styles.navTextActive}>Beranda</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => showComingSoon("Kelas")}
        >
          <Text style={styles.navIcon}>◇</Text>
          <Text style={styles.navText}>Kelas</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => showComingSoon("Notifikasi")}
        >
          <Text style={styles.navIcon}>♧</Text>
          <Text style={styles.navText}>Notifikasi</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => showComingSoon("Profil")}
        >
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navText}>Profil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EAF2F8",
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerActions: {
    position: "absolute",
    right: 20,
    top: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D5E9F8",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.blue,
  },
  searchButton: {
    width: 28,
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 29,
    color: COLORS.text,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minHeight: 154,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    elevation: 2,
    shadowColor: "#A9BED0",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  orangeSquare: {
    backgroundColor: "#FFE2B4",
  },
  summaryIcon: {
    fontSize: 23,
    color: COLORS.blue,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#424B59",
    marginBottom: 6,
  },
  summaryNumber: {
    fontSize: 29,
    fontWeight: "800",
    color: COLORS.text,
  },
  summaryUnit: {
    fontSize: 19,
    fontWeight: "400",
    color: "#424B59",
  },
  activeBadge: {
    position: "absolute",
    top: 24,
    right: 12,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  activeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },
  deadlineSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 1,
  },
  deadlineText: {
    color: "#D62828",
    fontSize: 11,
    marginTop: 6,
  },
  deadlineBadge: {
    position: "absolute",
    top: 24,
    right: 12,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  deadlineBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#583900",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },
  countBadge: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#D6EEFF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: COLORS.blue,
    fontWeight: "700",
    fontSize: 12,
  },
  linkText: {
    color: "#0062C4",
    fontWeight: "700",
    fontSize: 13,
  },
  classList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  classCard: {
    width: 282,
    minHeight: 170,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    paddingTop: 18,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#A9BED0",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  classTopRow: {
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  classCode: {
    color: "#424B59",
    fontSize: 13,
  },
  roleBadge: {
    backgroundColor: "#FFE0AD",
    color: "#5C3D00",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 13,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "700",
  },
  className: {
    paddingHorizontal: 18,
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  classRoom: {
    paddingHorizontal: 18,
    marginTop: 5,
    fontSize: 13,
    color: "#424B59",
  },
  classFooter: {
    marginTop: 15,
    minHeight: 48,
    backgroundColor: "#EAF6FF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#424B59",
  },
  taskCountBadge: {
    backgroundColor: COLORS.white,
    color: COLORS.blue,
    fontWeight: "700",
    fontSize: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  sortText: {
    fontSize: 12,
    color: "#424B59",
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 9,
    marginBottom: 18,
  },
  filterButton: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterButtonActive: {
    backgroundColor: COLORS.blue,
  },
  filterText: {
    fontSize: 12,
    color: "#424B59",
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },
  taskCard: {
    marginHorizontal: 18,
    marginBottom: 15,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    overflow: "hidden",
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#A9BED0",
    shadowOpacity: 0.13,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  taskAccent: {
    width: 6,
  },
  taskContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 17,
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 7,
  },
  taskDeadlineBadge: {
    backgroundColor: "#FFE0AD",
    color: "#563900",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: "hidden",
  },
  subjectBadge: {
    backgroundColor: "#D9F1FF",
    color: "#005AA8",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: "hidden",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    color: COLORS.text,
  },
  completedTitle: {
    color: "#606774",
    textDecorationLine: "line-through",
  },
  checkButton: {
    width: 29,
    height: 29,
    borderRadius: 7,
    backgroundColor: "#D9F1FF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonDone: {
    backgroundColor: COLORS.blue,
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },
  taskCreator: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 19,
    color: "#424B59",
  },
  taskBottomRow: {
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "#DDF3FF",
    color: "#424B59",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    overflow: "hidden",
  },
  statusDone: {
    color: COLORS.blue,
  },
  attachmentText: {
    color: "#424B59",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    marginHorizontal: 18,
    padding: 28,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 17,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
  },
  addTaskButton: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginRight: 20,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 22,
    paddingVertical: 17,
    borderRadius: 32,
    elevation: 5,
    shadowColor: "#124DA8",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addTaskText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 16,
  },
  bottomNav: {
    minHeight: 72,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navIcon: {
    fontSize: 24,
    color: "#454D5A",
  },
  navIconActive: {
    fontSize: 24,
    color: COLORS.blue,
  },
  navText: {
    fontSize: 11,
    color: "#454D5A",
  },
  navTextActive: {
    fontSize: 11,
    color: COLORS.blue,
    fontWeight: "700",
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
});
