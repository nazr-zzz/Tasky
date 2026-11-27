import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  registerUser,
  logoutUser,
  checkSession,
  requestPasswordReset,
} from "../services/auth";

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const KEY = "tasky_user";
const DEVICE_KEY = "tasky_device_id";
const CHECK_MS = 15000; // cek sesi ke server tiap 15 detik

// ID unik per HP, dibuat sekali lalu disimpan
export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// Samakan bentuk data user agar kompatibel dengan seluruh layar
const normalize = (u) => {
  if (!u) return null;
  const id = u.userId ?? u.uid ?? u.USER_ID ?? u.id;
  return {
    ...u,
    uid: id,
    id,
    userId: id,
    name: u.nama ?? u.name ?? "",
    nama: u.nama ?? u.name ?? "",
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [deviceBusy, setDeviceBusy] = useState(false);
  const userRef = useRef(null);

  const applyUser = useCallback((u) => {
    userRef.current = u;
    setUser(u);
  }, []);

  // Hapus sesi lokal (tanpa memanggil server)
  const clearLocal = useCallback(async () => {
    applyUser(null);
    try {
      await AsyncStorage.removeItem(KEY);
    } catch (e) {}
  }, [applyUser]);

  // Pulihkan sesi saat aplikasi dibuka, lalu validasi ke server
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw && active) {
          const u = normalize(JSON.parse(raw));
          const deviceId = await getDeviceId();
          try {
            const res = await checkSession(u.userId, deviceId);
            if (res?.aktif === false) {
              await clearLocal();
              setAuthError("Sesi berakhir karena akun dibuka di perangkat lain.");
            } else {
              applyUser(u);
            }
          } catch (e) {
            // offline: tetap pulihkan, nanti dicek ulang
            applyUser(u);
          }
        }
      } catch (e) {
        console.log("Gagal memulihkan sesi:", e?.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyUser, clearLocal]);

  // Cek berkala: kalau device lain mengambil alih akun, keluar otomatis
  useEffect(() => {
    if (!user?.userId) return;
    let stop = false;

    const verify = async () => {
      if (stop || !userRef.current) return;
      try {
        const deviceId = await getDeviceId();
        const res = await checkSession(userRef.current.userId, deviceId);
        if (!stop && res?.aktif === false) {
          await clearLocal();
          setAuthError("Sesi berakhir karena akun dibuka di perangkat lain.");
        }
      } catch (e) {
        // abaikan error jaringan
      }
    };

    const timer = setInterval(verify, CHECK_MS);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") verify();
    });

    return () => {
      stop = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [user?.userId, clearLocal]);

  const saveUser = useCallback(
    async (u) => {
      const data = normalize(u);
      applyUser(data);
      try {
        await AsyncStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {}
      return data;
    },
    [applyUser]
  );

  // force = true -> keluarkan perangkat lain, lalu masuk di sini
  const login = useCallback(
    async (identitas, password, force = false) => {
      setAuthError("");
      setDeviceBusy(false);
      const deviceId = await getDeviceId();
      const res = await loginUser(identitas, password, deviceId, force);

      if (res?.kode === "DEVICE_BUSY") {
        const msg =
          "Akun ini sedang dipakai di perangkat lain. Logout dulu di perangkat tersebut.";
        setDeviceBusy(true);
        setAuthError(msg);
        const err = new Error(msg);
        err.code = "DEVICE_BUSY";
        throw err;
      }
      if (!res?.user) {
        throw new Error(res?.pesan || "Email atau kata sandi salah.");
      }
      return saveUser(res.user);
    },
    [saveUser]
  );

  const register = useCallback(
    async ({ name, nim, email, password }) => {
      setAuthError("");
      const res = await registerUser(name, nim, email, password);
      if (!res?.user) {
        throw new Error(res?.pesan || "Pendaftaran gagal.");
      }
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const u = userRef.current;
    try {
      if (u?.userId) {
        const deviceId = await getDeviceId();
        await logoutUser(u.userId, deviceId); // kosongkan kunci device di server
      }
    } catch (e) {}
    await clearLocal();
  }, [clearLocal]);

  const resetPassword = useCallback(async (email) => {
    const res = await requestPasswordReset(email);
    if (res?.sukses === false) {
      throw new Error(res?.pesan || "Gagal mengirim permintaan reset.");
    }
    return res;
  }, []);

  // Memperbarui data user di memori + penyimpanan (mis. setelah edit profil)
  const updateUser = useCallback(
    async (patch) => saveUser({ ...userRef.current, ...patch }),
    [saveUser]
  );

  const value = useMemo(
    () => ({
      user,
      profile: user,
      loading,
      authError,
      deviceBusy,
      login,
      register,
      logout,
      updateUser,
      resetPassword,
    }),
    [user, loading, authError, deviceBusy, login, register, logout, updateUser, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}