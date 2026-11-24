import { Platform } from "react-native";
import Constants from "expo-constants";

// IP default jaringan lokal saat ini
export const CURRENT_LAN_IP = "192.168.100.81";
export const BACKEND_PORT = "3000";

let customBaseUrl = null;

export function setCustomBaseUrl(url) {
  customBaseUrl = url;
}

export function getCustomBaseUrl() {
  return customBaseUrl;
}

/**
 * Mendeteksi base URL secara dinamis agar berjalan di:
 * 1. Web browser (Chrome, Edge, Safari via Expo Web)
 * 2. Expo Go di perangkat fisik Android
 * 3. Expo Go di perangkat fisik iOS (iPhone / iPad)
 * 4. Android Emulator
 */
export function getBaseUrl() {
  if (customBaseUrl) {
    return customBaseUrl;
  }

  // 1. Web Browser
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.hostname
    ) {
      const host = window.location.hostname;

      if (host === "localhost" || host === "127.0.0.1") {
        return `http://localhost:${BACKEND_PORT}`;
      }

      return `http://${host}:${BACKEND_PORT}`;
    }

    return `http://localhost:${BACKEND_PORT}`;
  }

  // 2. Expo Go di Android / iOS fisik
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];

    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:${BACKEND_PORT}`;
    }
  }

  // 3. Fallback
  return `http://${CURRENT_LAN_IP}:${BACKEND_PORT}`;
}

export async function fetchWithTimeout(
  resource,
  options = {},
  timeout = 7000
) {
  const controller = new AbortController();

  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    return response;
  } catch (error) {
    clearTimeout(id);

    if (error.name === "AbortError") {
      throw new Error(
        "Waktu koneksi habis (Timeout). Pastikan server backend berjalan di port 3000 dan terhubung ke Wi-Fi yang sama."
      );
    }

    throw error;
  }
}

// Membaca JSON dengan aman: tidak error jika respons kosong / bukan JSON
async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// Deadline selalu dikirim dalam format ISO (Date, angka, atau teks yang bisa dibaca)
function normalizeDeadline(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? value : value.toISOString();
  }
  return value;
}

function normalizeTaskPayload(taskData) {
  const payload = { ...taskData };

  if (payload.deadline !== undefined && payload.deadline !== null) {
    payload.deadline = normalizeDeadline(payload.deadline);
  }

  return payload;
}

// =====================================================
// AUTH SERVICES
// =====================================================

export async function loginUser(identitas, password) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identitas, password }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Login gagal.");
  }

  return data;
}

// semester bersifat opsional (angka 1-14)
export async function registerUser(nama, nim, email, password, semester) {
  const baseUrl = getBaseUrl();

  const body = { nama, nim, email, password };
  if (semester !== undefined && semester !== null && semester !== "") {
    body.semester = Number(semester);
  }

  const response = await fetchWithTimeout(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Registrasi gagal.");
  }

  return data;
}

export async function fetchProfile(userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/auth/profile/${encodeURIComponent(userId)}`
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil profil");
  }

  return data;
}

// profileData: { nama?, email?, password?, semester? }
export async function updateProfile(userId, profileData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/auth/profile/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui profil");
  }

  return data;
}

export async function kirimKodeReset(email) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/auth/lupa-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengirim kode verifikasi.");
  }

  return data;
}

export async function resetPasswordDenganKode(email, kode, passwordBaru) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, kode, passwordBaru }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengubah kata sandi.");
  }

  return data;
}

// =====================================================
// KELAS SERVICES (US-01, US-02, US-09)
// =====================================================

export async function fetchClasses(userId) {
  const baseUrl = getBaseUrl();

  const url = userId
    ? `${baseUrl}/api/kelas?userId=${encodeURIComponent(userId)}`
    : `${baseUrl}/api/kelas`;

  const response = await fetchWithTimeout(url);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil daftar kelas");
  }

  return data;
}

export async function fetchClassDetail(kelasId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}`
  );
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil detail kelas");
  }

  return data;
}

export async function createClass(nama_kelas, kode_kelas, dibuat_oleh) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/kelas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nama_kelas, kode_kelas, dibuat_oleh }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal membuat kelas");
  }

  return data;
}

export async function joinClass(kode_kelas, user_id) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/kelas/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kode_kelas, user_id }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal bergabung ke kelas");
  }

  return data;
}

export async function fetchClassMembers(kelasId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}/anggota`
  );
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil anggota kelas");
  }

  return data;
}

export async function updateMemberRole(kelasId, userId, peran) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}/anggota/${encodeURIComponent(userId)}/peran`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peran }),
    }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengubah peran anggota");
  }

  return data;
}

export async function leaveClass(kelasId, userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}/anggota/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal keluar dari kelas");
  }

  return data;
}

export async function deleteClass(kelasId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}`,
    { method: "DELETE" }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal menghapus kelas");
  }

  return data;
}

// =====================================================
// TASK SERVICES (US-03, US-04, US-05, US-07, US-11)
// =====================================================

export async function fetchTasks(userId, kelasId) {
  const baseUrl = getBaseUrl();

  const params = new URLSearchParams();

  if (userId) params.append("userId", userId);
  if (kelasId) params.append("kelasId", kelasId);

  const url = `${baseUrl}/tasks${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetchWithTimeout(url);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil data tugas");
  }

  return data;
}

export async function fetchTaskStats(userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/stats?userId=${encodeURIComponent(userId)}`
  );
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil statistik tugas");
  }

  return data;
}

/**
 * Tambah tugas (hanya PJMK).
 * taskData wajib berisi: dibuat_oleh (userId) dan kelas_id.
 * deadline boleh berupa Date atau string ISO.
 */
export async function createTask(taskData) {
  const baseUrl = getBaseUrl();

  if (!taskData || !taskData.dibuat_oleh || !taskData.kelas_id) {
    throw new Error("Data pembuat tugas dan kelas wajib disertakan.");
  }

  const response = await fetchWithTimeout(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeTaskPayload(taskData)),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal menambahkan tugas");
  }

  return data;
}

/**
 * Ubah tugas / ubah deadline (hanya PJMK).
 * userId = pengguna yang sedang login, dikirim sebagai diubah_oleh.
 * Contoh: updateTask(task.id, { judul, deadline: date.toISOString() }, currentUser.userId)
 * Untuk kompatibilitas, userId juga boleh disertakan langsung di taskData.diubah_oleh.
 */
export async function updateTask(taskId, taskData, userId) {
  const baseUrl = getBaseUrl();

  const diubahOleh = userId || taskData?.diubah_oleh;

  if (!diubahOleh) {
    throw new Error("Identitas pengguna (diubah_oleh) wajib disertakan.");
  }

  const payload = {
    ...normalizeTaskPayload(taskData),
    diubah_oleh: diubahOleh,
  };

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui tugas");
  }

  return data;
}

export async function updateTaskStatus(taskId, userId, status) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status }),
    }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui status pengerjaan");
  }

  return data;
}

/**
 * Hapus tugas (hanya PJMK). userId dikirim lewat query ?oleh=<userId>.
 * Contoh pemanggilan di dashboard: deleteTask(String(taskId), currentUser.userId)
 */
export async function deleteTask(taskId, userId) {
  const baseUrl = getBaseUrl();

  if (!userId) {
    throw new Error("Identitas pengguna wajib disertakan untuk menghapus tugas.");
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}?oleh=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const data = await parseJson(response);
    throw new Error(data.pesan || "Gagal menghapus tugas");
  }

  return true;
}

// =====================================================
// CATATAN PRIBADI (US-08)
// =====================================================

export async function fetchNotes(userId, kelasId) {
  const baseUrl = getBaseUrl();

  const params = new URLSearchParams({ userId: String(userId) });

  if (kelasId) {
    params.append("kelasId", kelasId);
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan?${params.toString()}`
  );
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil catatan");
  }

  return data;
}

export async function createNote(noteData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(`${baseUrl}/api/catatan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(noteData),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal menyimpan catatan");
  }

  return data;
}

export async function updateNote(noteId, noteData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan/${encodeURIComponent(noteId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData),
    }
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui catatan");
  }

  return data;
}

export async function deleteNote(noteId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan/${encodeURIComponent(noteId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const data = await parseJson(response);
    throw new Error(data.pesan || "Gagal menghapus catatan");
  }

  return true;
}

// =====================================================
// NOTIFIKASI (US-06, US-07)
// =====================================================

export async function fetchNotifications(userId) {
  const baseUrl = getBaseUrl();

  const url = userId
    ? `${baseUrl}/api/notifications?userId=${encodeURIComponent(userId)}`
    : `${baseUrl}/api/notifications`;

  const response = await fetchWithTimeout(url);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil notifikasi");
  }

  return data;
}

export async function markNotificationRead(notifId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/notifications/${encodeURIComponent(notifId)}/read`,
    { method: "PUT" }
  );

  return response.ok;
}

export async function markAllNotificationsRead(userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/notifications/read-all`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }
  );

  return response.ok;
}

// =====================================================
// CEK KONEKSI SERVER
// =====================================================

export async function checkServerConnection() {
  const baseUrl = getBaseUrl();

  try {
    const res = await fetchWithTimeout(`${baseUrl}/tasks`, {}, 4000);

    return {
      ok: res.ok,
      status: res.status,
      url: baseUrl,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      url: baseUrl,
    };
  }
}