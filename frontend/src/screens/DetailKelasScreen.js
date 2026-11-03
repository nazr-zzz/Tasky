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
  TextInput,
  Clipboard,
} from "react-native";
import { router } from "expo-router";

export default function DetailKelasScreen({
  kelas,
  currentUser,
  tasks = [],
  onBack,
  onToggleTask,
  onAddTask,
  onOpenMembers,
  onOpenNotes,
}) {
  const [activeTab, setActiveTab] = useState("tugas"); // "tugas" | "anggota" | "catatan"

  const classData = kelas || {
    kelas_id: "k1",
    nama_kelas: "Basis Data A",
    kode_kelas: "H6C3-X7K2",
    dibuat_oleh: "u1",
    jumlah_anggota: 42,
    jumlah_tugas: 2,
  };

  const handleCopyCode = () => {
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(classData.kode_kelas);
    }
    Alert.alert("Berhasil Disalin! 📋", `Kode kelas "${classData.kode_kelas}" telah disalin ke papan klip.`);
  };

  const sampleSections = [
    {
      id: "sec-1",
      title: "📌 Praktikum Mandiri: Modul 4",
      subtitle: "Desain Relasional & Normalisasi Tabel",
      tasksCount: "2 Tugas",
      tasks: [
        {
          id: 1,
          title: "Normalisasi ERD & Skema Relasional",
          countdown: "⌛ H-1 • Besok, 23:59 WIB",
          info: "👤 Tugas Individu • 📄 Format PDF",
          weight: "Bobot: 15%",
          status: "Belum Dikerjakan",
          color: "#FFB632",
        },
        {
          id: 2,
          title: "Query SQL DDL & DML Dasar",
          countdown: "⌛ H-4 • Jumat, 23:59 WIB",
          info: "💻 Praktikum Lab • 📄 File .sql",
          weight: "Bobot: 10%",
          status: "Belum Dikerjakan",
          color: "#4D9BFF",
        },
      ],
    },
    {
      id: "sec-2",
      title: "📖 Teori & Diskusi Kelompok",
      subtitle: "Eksplorasi Arsitektur Database Modern",
      tasksCount: "1 Tugas",
      tasks: [
        {
          id: 4,
          title: "Review Paper: In-Memory Database vs RDBMS",
          countdown: "✓ Diserahkan 14 Mar, 10:20 WIB",
          info: "👥 Kelompok 3 • ⭐ Nilai: 94/100",
          weight: "Telah Dikirim • Selesai",
          status: "Selesai",
          color: "#12B76A",
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F9FD" />

      {/* HEADER ATAS SESUAI FIGMA */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBack || (() => router.back())}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detail Kelas</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            Alert.alert("Opsi Kelas", `${classData.nama_kelas}\nKode: ${classData.kode_kelas}`)
          }
        >
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER KODE KELAS SESUAI FIGMA */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>KODE KELAS</Text>
            <Text style={styles.bannerCode}>{classData.kode_kelas}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Text style={styles.copyIcon}>📋</Text>
            <Text style={styles.copyText}>Salin</Text>
          </TouchableOpacity>
        </View>

        {/* SEGMENTED TABS: TUGAS, ANGGOTA, CATATAN SESUAI FIGMA & SRS */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "tugas" && styles.tabItemActive]}
            onPress={() => setActiveTab("tugas")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === "tugas" && styles.tabTextActive]}>
              📋 Tugas (2 Aktif)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "anggota" && styles.tabItemActive]}
            onPress={onOpenMembers || (() => setActiveTab("anggota"))}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === "anggota" && styles.tabTextActive]}>
              👥 Anggota (42)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "catatan" && styles.tabItemActive]}
            onPress={onOpenNotes || (() => setActiveTab("catatan"))}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === "catatan" && styles.tabTextActive]}>
              📝 Catatan
            </Text>
          </TouchableOpacity>
        </View>

        {/* DAFTAR SECTION TUGAS SESUAI GAMBAR FIGMA */}
        {sampleSections.map((section) => (
          <View key={section.id} style={styles.sectionBox}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{section.tasksCount}</Text>
              </View>
            </View>

            {section.tasks.map((task) => {
              const isDone = task.status === "Selesai";
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View
                    style={[styles.taskAccent, { backgroundColor: task.color }]}
                  />
                  <View style={styles.taskBody}>
                    <View style={styles.taskMetaRow}>
                      <Text style={styles.taskCountdown}>{task.countdown}</Text>
                      <Text
                        style={[
                          styles.taskStatusTag,
                          isDone ? styles.statusDoneTag : styles.statusPendingTag,
                        ]}
                      >
                        {task.status}
                      </Text>
                    </View>

                    <Text
                      style={[styles.taskTitle, isDone && styles.taskTitleDone]}
                    >
                      {task.title}
                    </Text>

                    <Text style={styles.taskInfo}>{task.info}</Text>

                    <View style={styles.taskFooterRow}>
                      <Text style={styles.taskWeight}>{task.weight}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            task.title,
                            `${task.info}\nDeadline: ${task.countdown}\nStatus: ${task.status}`
                          )
                        }
                      >
                        <Text style={styles.taskLink}>
                          {isDone ? "Lihat Kiriman ↗" : "Rincian & Kumpul >"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON: TAMBAH TUGAS KELAS (PJMK) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={onAddTask}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>＋</Text>
          <Text style={styles.fabText}>Tambah Tugas Kelas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F9FD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#102A36",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A36",
  },
  moreIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#64748B",
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EBF3FC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D2E4F7",
  },
  bannerLeft: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bannerCode: {
    fontSize: 22,
    fontWeight: "900",
    color: "#073B82",
    letterSpacing: 1.5,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  copyIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#102A36",
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  tabItem: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabItemActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  tabText: {
    fontSize: 12,
    color: "#475467",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionBox: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  sectionBadge: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#0F4C81",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EBF1F6",
  },
  taskAccent: {
    width: 6,
  },
  taskBody: {
    flex: 1,
    padding: 14,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  taskCountdown: {
    fontSize: 11,
    color: "#B54708",
    fontWeight: "700",
    backgroundColor: "#FEF0C7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  taskStatusTag: {
    fontSize: 10,
    fontWeight: "700",
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  statusPendingTag: {
    backgroundColor: "#F1F5F9",
    color: "#475467",
  },
  statusDoneTag: {
    backgroundColor: "#D1FADF",
    color: "#027A48",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
  },
  taskTitleDone: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  taskInfo: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 10,
  },
  taskFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  taskWeight: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "500",
  },
  taskLink: {
    fontSize: 11,
    color: "#073B82",
    fontWeight: "700",
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#073B82",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: "#073B82",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 8,
  },
  fabText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
