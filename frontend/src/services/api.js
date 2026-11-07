
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

// =====================================================
// AUTH SERVICES
// =====================================================

export async function loginUser(identitas, password) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identitas,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Login gagal.");
  }

  return data;
}

export async function registerUser(nama, nim, email, password) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nama,
        nim,
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Registrasi gagal.");
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

  const data = await response.json();

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil detail kelas");
  }

  return data;
}

export async function createClass(
  nama_kelas,
  kode_kelas,
  dibuat_oleh
) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nama_kelas,
        kode_kelas,
        dibuat_oleh,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal membuat kelas");
  }

  return data;
}

export async function joinClass(kode_kelas, user_id) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kode_kelas,
        user_id,
      }),
    }
  );

  const data = await response.json();

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

  const data = await response.json();

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        peran,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengubah peran anggota");
  }

  return data;
}

export async function leaveClass(kelasId, userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}/anggota/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal keluar dari kelas");
  }

  return data;
}

export async function deleteClass(kelasId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/kelas/${encodeURIComponent(kelasId)}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

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

  const data = await response.json();

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil statistik tugas");
  }

  return data;
}

export async function createTask(taskData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal menambahkan tugas");
  }

  return data;
}

export async function updateTask(taskId, taskData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    }
  );

  const data = await response.json();

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui status pengerjaan");
  }

  return data;
}

export async function deleteTask(taskId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(data.pesan || "Gagal menghapus tugas");
  }

  return true;
}

// =====================================================
// CATATAN PRIBADI (US-08)
// =====================================================

// Mengambil seluruh catatan milik mahasiswa
export async function fetchNotes(userId, kelasId) {
  const baseUrl = getBaseUrl();

  const params = new URLSearchParams({
    userId: String(userId),
  });

  if (kelasId) {
    params.append("kelasId", kelasId);
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil catatan");
  }

  return data;
}

// Menambahkan catatan baru
export async function createNote(noteData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal menyimpan catatan");
  }

  return data;
}

// MEMPERBARUI CATATAN YANG SUDAH ADA
export async function updateNote(noteId, noteData) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan/${encodeURIComponent(noteId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal memperbarui catatan");
  }

  return data;
}

// Menghapus catatan
export async function deleteNote(noteId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/catatan/${encodeURIComponent(noteId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Gagal mengambil notifikasi");
  }

  return data;
}

export async function markNotificationRead(notifId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/notifications/${encodeURIComponent(notifId)}/read`,
    {
      method: "PUT",
    }
  );

  return response.ok;
}

export async function markAllNotificationsRead(userId) {
  const baseUrl = getBaseUrl();

  const response = await fetchWithTimeout(
    `${baseUrl}/api/notifications/read-all`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
      }),
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
    const res = await fetchWithTimeout(
      `${baseUrl}/tasks`,
      {},
      4000
    );

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
