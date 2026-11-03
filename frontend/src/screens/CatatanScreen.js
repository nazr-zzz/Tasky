import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function CatatanScreen({ currentUser, activeClass }) {
  const [filterMatkul, setFilterMatkul] = useState("Semua");
  const [selectedKategori, setSelectedKategori] = useState("Pemrograman Web Lanjut");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");

  const [notes, setNotes] = useState([
    {
      id: "c_1",
      matkul: "Pemrograman Web Lanjut",
      title: "Catatan Endpoint Login & JWT",
      content:
        "Jangan lupa tambahkan library bcrypt untuk hashing password sebelum disimpan ke database SQLite/Postgres. Token expired dibuat 1 jam.",
      time: "Diperbarui kemarin • Tersimpan lokal",
      badgeBg: "#DBEAFE",
      badgeText: "#1D4ED8",
    },
    {
      id: "c_2",
      matkul: "Basis Data Terdistribusi",
      title: "Ide Sharding Key",
      content:
        "Gunakan user_id dengan hashing MD5 sebagai shard key untuk distribusi data yang merata pada 3 node cluster.",
      time: "12 Nov 2024 • Tersimpan lokal",
      badgeBg: "#F3E8FF",
      badgeText: "#7E22CE",
    },
  ]);

  const matkulList = [
    "Semua",
    "Pemrograman Web Lanjut",
    "Basis Data",
  ];

  const kategoriOptions = [
    "Pemrograman Web Lanjut",
    "Basis Data",
    "Jaringan",
  ];

  const handleSimpanCatatan = () => {
    if (!judul.trim() || !isi.trim()) {
      Alert.alert("Perhatian", "Topik/Judul dan isi catatan tidak boleh kosong.");
      return;
    }

    const newNote = {
      id: "c_" + Date.now(),
      matkul: selectedKategori,
      title: judul.trim(),
      content: isi.trim(),
      time: "Baru saja • Tersimpan lokal",
      badgeBg: selectedKategori.includes("Web") ? "#DBEAFE" : "#F3E8FF",
      badgeText: selectedKategori.includes("Web") ? "#1D4ED8" : "#7E22CE",
    };

    setNotes([newNote, ...notes]);
    setJudul("");
    setIsi("");
    Alert.alert("Catatan Disimpan! 📝", "Catatan pribadi Anda berhasil disimpan secara aman di perangkat lokal.");
  };

  const handleDelete = (id) => {
    Alert.alert("Hapus Catatan", "Yakin ingin menghapus catatan pribadi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => setNotes(notes.filter((n) => n.id !== id)),
      },
    ]);
  };

  const filteredNotes = notes.filter((n) => {
    if (filterMatkul === "Semua") return true;
    return n.matkul.toLowerCase().includes(filterMatkul.toLowerCase());
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* STRIP MODE OFFLINE */}
      <View style={styles.offlineStrip}>
        <Text style={styles.offlineStripText}>
          ⚠️ Mode Offline • Perubahan akan disinkronkan saat online 🔸
        </Text>
      </View>

      {/* PRIVACY CARD: PRIVASI PENUH TERJAMIN */}
      <View style={styles.privacyCard}>
        <View style={styles.lockCircle}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <View style={styles.privacyContent}>
          <Text style={styles.privacyTitle}>Privasi Penuh Terjamin</Text>
          <Text style={styles.privacyDesc}>
            Catatan bersifat pribadi dan hanya dapat dilihat oleh pemilik akun.
            Tidak dibagikan ke anggota kelas lainnya.
          </Text>
        </View>
      </View>

      {/* CHIPS FILTER MATA KULIAH */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {matkulList.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.filterChip,
                filterMatkul === m && styles.filterChipActive,
              ]}
              onPress={() => setFilterMatkul(m)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterMatkul === m && styles.filterChipTextActive,
                ]}
              >
                {filterMatkul === m ? "✔ " : ""}
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.totalMatkulText}>4 Mata Kuliah</Text>
      </View>

      {/* BOX TULIS CATATAN BARU */}
      <View style={styles.formCard}>
        <View style={styles.formHeaderRow}>
          <Text style={styles.formTitle}>✍️ Tulis Catatan Baru</Text>
          <View style={styles.lokalBadge}>
            <Text style={styles.lokalBadgeText}>Lokal</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Topik / Judul</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Contoh: Rumus Normalisasi 3NF"
          placeholderTextColor="#94A3B8"
          value={judul}
          onChangeText={setJudul}
        />

        <Text style={styles.inputLabel}>Kategori Modul Kuliah:</Text>
        <View style={styles.kategoriRow}>
          {kategoriOptions.map((k) => (
            <TouchableOpacity
              key={k}
              style={[
                styles.kategoriChip,
                selectedKategori === k && styles.kategoriChipActive,
              ]}
              onPress={() => setSelectedKategori(k)}
            >
              <Text
                style={[
                  styles.kategoriChipText,
                  selectedKategori === k && styles.kategoriChipTextActive,
                ]}
              >
                {k}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Isi Catatan Kuliah</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Catatan rumus penting, pembagian tugas kelompok internal, atau rangkuman materi..."
          placeholderTextColor="#94A3B8"
          value={isi}
          onChangeText={setIsi}
          multiline
          numberOfLines={4}
        />

        <View style={styles.formFooterRow}>
          <Text style={styles.autoSavedText}>✔ Tersimpan otomatis</Text>
          <TouchableOpacity
            style={styles.saveNoteBtn}
            onPress={handleSimpanCatatan}
            activeOpacity={0.8}
          >
            <Text style={styles.saveNoteBtnText}>Simpan Catatan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION CATATAN TERSIMPAN */}
      <View style={styles.savedSectionHeader}>
        <Text style={styles.savedTitle}>
          Catatan Tersimpan ({filteredNotes.length})
        </Text>
        <Text style={styles.savedSort}>Urut Terbaru</Text>
      </View>

      {/* DAFTAR KARTU CATATAN */}
      {filteredNotes.map((note) => (
        <View key={note.id} style={styles.noteCard}>
          <View style={styles.noteTopRow}>
            <View
              style={[styles.noteBadge, { backgroundColor: note.badgeBg }]}
            >
              <Text
                style={[styles.noteBadgeText, { color: note.badgeText }]}
              >
                ● {note.matkul}
              </Text>
            </View>

            <View style={styles.noteActionsRow}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Ubah Catatan", "Silakan edit teks catatan langsung di form atas.")
                }
                style={styles.actionIconBtn}
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(note.id)}
                style={styles.actionIconBtn}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteBody}>{note.content}</Text>

          <View style={styles.noteFooter}>
            <Text style={styles.noteTimeText}>🕒 {note.time}</Text>
            <Text style={styles.noteCheckIcon}>✔</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineStrip: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 7,
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
  privacyCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 14,
    alignItems: "flex-start",
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  lockIcon: {
    fontSize: 18,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
  },
  filterSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#073B82",
    borderColor: "#073B82",
  },
  filterChipText: {
    fontSize: 11,
    color: "#475467",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  totalMatkulText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
  },
  lokalBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  lokalBadgeText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#102A36",
    marginBottom: 6,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: "#102A36",
    marginBottom: 6,
  },
  kategoriRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  kategoriChip: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  kategoriChipActive: {
    backgroundColor: "#073B82",
  },
  kategoriChipText: {
    fontSize: 10,
    color: "#475467",
    fontWeight: "600",
  },
  kategoriChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  textArea: {
    height: 75,
    paddingTop: 8,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  formFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autoSavedText: {
    fontSize: 10,
    color: "#15803D",
    fontWeight: "600",
  },
  saveNoteBtn: {
    backgroundColor: "#073B82",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveNoteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  savedSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
  },
  savedSort: {
    fontSize: 11,
    color: "#64748B",
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  noteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  noteBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  noteActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    padding: 2,
  },
  actionIcon: {
    fontSize: 13,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 11,
    color: "#475467",
    lineHeight: 16,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  noteTimeText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  noteCheckIcon: {
    fontSize: 11,
    color: "#15803D",
  },
});
