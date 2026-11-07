
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../services/api";

// =========================================================================
// HELPER: PEMETAAN DATA CATATAN DARI SERVER
// =========================================================================

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const PALETTE = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#F3E8FF", text: "#7E22CE" },
  { bg: "#DCFCE7", text: "#15803D" },
  { bg: "#FEF3C7", text: "#B45309" },
  { bg: "#FEE2E2", text: "#B91C1C" },
];

function warnaKategori(nama) {
  let hash = 0;

  for (let i = 0; i < nama.length; i++) {
    hash = (hash * 31 + nama.charCodeAt(i)) % 1000;
  }

  return PALETTE[hash % PALETTE.length];
}

function formatTanggal(nilai) {
  if (!nilai) return "-";

  const d = new Date(nilai);

  if (isNaN(d.getTime())) return String(nilai);

  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function mapNote(n) {
  const matkul = String(
    n.MATA_KULIAH ??
    n.mata_kuliah ??
    n.KATEGORI ??
    n.kategori ??
    "Umum"
  );

  const waktuRaw =
    n.UPDATED_AT ??
    n.updated_at ??
    n.CREATED_AT ??
    n.created_at ??
    n.TANGGAL ??
    n.tanggal;

  const ts = waktuRaw ? new Date(waktuRaw).getTime() : 0;

  const warna = warnaKategori(matkul);

  return {
    id: n.CATATAN_ID ?? n.catatan_id ?? n.id,
    matkul,
    title: n.JUDUL ?? n.judul ?? "(Tanpa judul)",
    content: n.ISI ?? n.isi ?? "",
    time: formatTanggal(waktuRaw),
    ts: isNaN(ts) ? 0 : ts,
    badgeBg: warna.bg,
    badgeText: warna.text,
  };
}

// =========================================================================
// HALAMAN CATATAN
// =========================================================================

export default function CatatanScreen({ currentUser, activeClass }) {

  const userId = currentUser?.userId;

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [filterMatkul, setFilterMatkul] = useState("Semua");
  const [kategori, setKategori] = useState("");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");

  // STATE UNTUK EDIT CATATAN
  const [editingNote, setEditingNote] = useState(null);

  // =========================================================================
  // MEMUAT CATATAN DARI SERVER
  // =========================================================================

  const loadNotes = async () => {
    setError("");

    try {
      const data = await fetchNotes(userId);

      const list = Array.isArray(data) ? data : [];

      const mapped = list
        .map(mapNote)
        .sort((a, b) => b.ts - a.ts);

      setNotes(mapped);

    } catch (e) {
      setError(e?.message || "Gagal memuat catatan.");
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadNotes().finally(() => setLoading(false));

  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);

    await loadNotes();

    setRefreshing(false);
  };

  // =========================================================================
  // FILTER KATEGORI
  // =========================================================================

  const kategoriTersedia = Array.from(
    new Set(notes.map((n) => n.matkul))
  );

  const matkulList = ["Semua", ...kategoriTersedia];

  const activeFilter = matkulList.includes(filterMatkul)
    ? filterMatkul
    : "Semua";

  const filteredNotes = notes.filter(
    (n) => activeFilter === "Semua" || n.matkul === activeFilter
  );

  // =========================================================================
  // LANGKAH 1 DAN 2: FUNGSI EDIT CATATAN
  // =========================================================================

  const handleEditNote = (note) => {

    // Menyimpan catatan yang sedang diedit
    setEditingNote(note);

    // Memasukkan data lama ke dalam formulir
    setJudul(
      note.title === "(Tanpa judul)" ? "" : note.title
    );

    setKategori(note.matkul);

    setIsi(note.content);

  };

  // =========================================================================
  // LANGKAH 3: SIMPAN CATATAN BARU ATAU UPDATE CATATAN LAMA
  // =========================================================================

  const handleSimpanCatatan = async () => {

    if (!judul.trim() || !isi.trim()) {
      Alert.alert(
        "Perhatian",
        "Topik/Judul dan isi catatan tidak boleh kosong."
      );
      return;
    }

    if (saving) return;

    setSaving(true);

    try {

      const noteData = {
        user_id: userId,
        kelas_id: activeClass?.kelas_id ?? null,
        judul: judul.trim(),
        isi: isi.trim(),
        mata_kuliah: kategori.trim() || "Umum",
      };

      if (editingNote) {

        // UPDATE CATATAN LAMA
        await updateNote(editingNote.id, noteData);

        Alert.alert(
          "Berhasil!",
          "Catatan berhasil diperbarui."
        );

      } else {

        // SIMPAN CATATAN BARU
        await createNote(noteData);

        Alert.alert(
          "Catatan Disimpan!",
          "Catatan pribadi Anda berhasil disimpan ke server."
        );

      }

      // Muat ulang daftar catatan
      await loadNotes();

      // Kosongkan formulir
      setJudul("");
      setIsi("");
      setKategori("");
      setEditingNote(null);

    } catch (e) {

      Alert.alert(
        "Gagal Menyimpan",
        e?.message || "Tidak dapat terhubung ke server."
      );

    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // FUNGSI BATAL EDIT
  // =========================================================================

  const handleBatalEdit = () => {

    setEditingNote(null);

    setJudul("");
    setKategori("");
    setIsi("");

  };

  // =========================================================================
  // FUNGSI HAPUS CATATAN
  // =========================================================================

  const handleDelete = (id) => {

    Alert.alert(
      "Hapus Catatan",
      "Yakin ingin menghapus catatan pribadi ini?",
      [
        {
          text: "Batal",
          style: "cancel"
        },
        {
          text: "Hapus",
          style: "destructive",

          onPress: async () => {

            try {

              await deleteNote(id);

              setNotes((prev) =>
                prev.filter((n) => n.id !== id)
              );

              // Jika catatan yang diedit dihapus,
              // kosongkan formulir edit
              if (editingNote?.id === id) {
                handleBatalEdit();
              }

            } catch (e) {

              Alert.alert(
                "Gagal Menghapus",
                e?.message || "Tidak dapat terhubung ke server."
              );

            }

          },
        },
      ]
    );

  };

  // =========================================================================
  // TAMPILAN UTAMA
  // =========================================================================

  return (

    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >

      {/* PRIVACY CARD */}

      <View style={styles.privacyCard}>

        <View style={styles.lockCircle}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <View style={styles.privacyContent}>

          <Text style={styles.privacyTitle}>
            Catatan Pribadi
          </Text>

          <Text style={styles.privacyDesc}>
            Catatan bersifat pribadi dan hanya dapat dilihat oleh pemilik akun.
            Tidak dibagikan ke anggota kelas lainnya.
          </Text>

        </View>

      </View>

      {/* FILTER KATEGORI */}

      {kategoriTersedia.length > 0 && (

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
                  activeFilter === m && styles.filterChipActive
                ]}
                onPress={() => setFilterMatkul(m)}
              >

                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === m && styles.filterChipTextActive
                  ]}
                >
                  {activeFilter === m ? "✔ " : ""}
                  {m}
                </Text>

              </TouchableOpacity>

            ))}

          </ScrollView>

          <Text style={styles.totalMatkulText}>
            {kategoriTersedia.length} Kategori
          </Text>

        </View>

      )}

      {/* FORM CATATAN */}

      <View style={styles.formCard}>

        <Text style={styles.formTitle}>
          {editingNote
            ? "✏️ Edit Catatan"
            : "✍️ Tulis Catatan Baru"}
        </Text>

        <Text style={styles.inputLabel}>
          Topik / Judul
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder="Contoh: Rumus Normalisasi 3NF"
          placeholderTextColor="#94A3B8"
          value={judul}
          onChangeText={setJudul}
        />

        <Text style={styles.inputLabel}>
          Mata Kuliah / Kategori
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder="Contoh: Basis Data (kosongkan untuk 'Umum')"
          placeholderTextColor="#94A3B8"
          value={kategori}
          onChangeText={setKategori}
        />

        {kategoriTersedia.length > 0 && (

          <View style={styles.kategoriRow}>

            {kategoriTersedia.map((k) => (

              <TouchableOpacity
                key={k}
                style={[
                  styles.kategoriChip,
                  kategori === k && styles.kategoriChipActive
                ]}
                onPress={() => setKategori(k)}
              >

                <Text
                  style={[
                    styles.kategoriChipText,
                    kategori === k && styles.kategoriChipTextActive
                  ]}
                >
                  {k}
                </Text>

              </TouchableOpacity>

            ))}

          </View>

        )}

        <Text style={styles.inputLabel}>
          Isi Catatan Kuliah
        </Text>

        <TextInput
          style={[
            styles.textInput,
            styles.textArea
          ]}
          placeholder="Catatan rumus penting, pembagian tugas kelompok internal, atau rangkuman materi..."
          placeholderTextColor="#94A3B8"
          value={isi}
          onChangeText={setIsi}
          multiline
          numberOfLines={4}
        />

        {/* TOMBOL BATAL DAN SIMPAN / UPDATE */}

        <View style={styles.formFooterRow}>

          {editingNote && (

            <TouchableOpacity
              onPress={handleBatalEdit}
              style={styles.cancelEditBtn}
              disabled={saving}
            >
              <Text style={styles.cancelEditBtnText}>
                Batal
              </Text>
            </TouchableOpacity>

          )}

          <TouchableOpacity
            style={[
              styles.saveNoteBtn,
              saving && styles.saveNoteBtnDisabled
            ]}
            onPress={handleSimpanCatatan}
            disabled={saving}
            activeOpacity={0.8}
          >

            {saving ? (

              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

            ) : (

              <Text style={styles.saveNoteBtnText}>
                {editingNote
                  ? "Update Catatan"
                  : "Simpan Catatan"}
              </Text>

            )}

          </TouchableOpacity>

        </View>

      </View>

      {/* SECTION CATATAN TERSIMPAN */}

      <View style={styles.savedSectionHeader}>

        <Text style={styles.savedTitle}>
          Catatan Tersimpan ({filteredNotes.length})
        </Text>

        <Text style={styles.savedSort}>
          Urut Terbaru
        </Text>

      </View>

      {/* STATUS MEMUAT / ERROR / KOSONG / DAFTAR */}

      {loading ? (

        <View style={styles.stateBox}>

          <ActivityIndicator
            size="large"
            color="#073B82"
          />

          <Text style={styles.stateText}>
            Memuat catatan dari server...
          </Text>

        </View>

      ) : error ? (

        <View style={styles.errorBox}>

          <Text style={styles.errorTitle}>
            Gagal Memuat Catatan
          </Text>

          <Text style={styles.errorDesc}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRefresh}
          >
            <Text style={styles.retryBtnText}>
              🔄 Coba Lagi
            </Text>
          </TouchableOpacity>

        </View>

      ) : filteredNotes.length === 0 ? (

        <View style={styles.stateBox}>

          <Text style={styles.emptyIcon}>
            📝
          </Text>

          <Text style={styles.stateText}>
            Belum ada catatan.
          </Text>

        </View>

      ) : (

        filteredNotes.map((note) => (

          <View
            key={String(note.id)}
            style={styles.noteCard}
          >

            {/* BAGIAN KATEGORI DAN TOMBOL EDIT / HAPUS */}

            <View style={styles.noteTopRow}>

              <View
                style={[
                  styles.noteBadge,
                  { backgroundColor: note.badgeBg }
                ]}
              >

                <Text
                  style={[
                    styles.noteBadgeText,
                    { color: note.badgeText }
                  ]}
                >
                  ● {note.matkul}
                </Text>

              </View>

              {/* TOMBOL EDIT DAN HAPUS */}

              <View style={styles.noteActions}>

                {/* TOMBOL EDIT */}

                <TouchableOpacity
                  onPress={() => handleEditNote(note)}
                  style={styles.actionIconBtn}
                  activeOpacity={0.7}
                >

                  <Text style={styles.actionIcon}>
                    ✏️
                  </Text>

                </TouchableOpacity>

                {/* TOMBOL HAPUS */}

                <TouchableOpacity
                  onPress={() => handleDelete(note.id)}
                  style={styles.actionIconBtn}
                  activeOpacity={0.7}
                >

                  <Text style={styles.actionIcon}>
                    🗑️
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

            {/* JUDUL CATATAN */}

            <Text style={styles.noteTitle}>
              {note.title}
            </Text>

            {/* ISI CATATAN */}

            <Text style={styles.noteBody}>
              {note.content}
            </Text>

            {/* TANGGAL CATATAN */}

            <View style={styles.noteFooter}>

              <Text style={styles.noteTimeText}>
                🕒 {note.time}
              </Text>

            </View>

          </View>

        ))

      )}

      <View style={{ height: 40 }} />

    </ScrollView>

  );

}

// =========================================================================
// STYLE CATATAN
// =========================================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
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

  formTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A36",
    marginBottom: 10,
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
    justifyContent: "flex-end",
    alignItems: "center",
  },

  // STYLE TOMBOL BATAL EDIT

  cancelEditBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },

  cancelEditBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  saveNoteBtn: {
    backgroundColor: "#073B82",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 110,
    alignItems: "center",
  },

  saveNoteBtnDisabled: {
    opacity: 0.7,
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

  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },

  emptyIcon: {
    fontSize: 34,
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
    flexShrink: 1,
  },

  noteBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // MENGATUR POSISI TOMBOL EDIT DAN HAPUS

  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionIconBtn: {
    padding: 4,
  },

  actionIcon: {
    fontSize: 16,
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

});
