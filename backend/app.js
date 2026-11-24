import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import kelasRoutes from "./routes/kelas.js";
import catatanRoutes from "./routes/catatan.js";
import notifRoutes from "./routes/notifications.js";

const app = express();

// CORS agar web browser dan Expo Go (Android/iOS) tidak terblokir
app.use(cors({ origin: true, credentials: true }));

// Body parser (JSON & form) dengan batas ukuran yang cukup untuk catatan
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Log sederhana: memudahkan melihat request dari HP masuk atau tidak
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
});

// Routes (dukung dengan atau tanpa prefix /api)
app.use("/tasks", taskRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/kelas", kelasRoutes);
app.use("/api/kelas", kelasRoutes);
app.use("/catatan", catatanRoutes);
app.use("/api/catatan", catatanRoutes);
app.use("/notifications", notifRoutes);
app.use("/api/notifications", notifRoutes);

app.get("/", (req, res) => {
  res.json({
    pesan: "Server Tasky berjalan dengan baik!",
    status: "online",
    waktu: new Date().toISOString(),
  });
});

// Route tidak ditemukan -> balas JSON (bukan HTML) agar mudah dibaca frontend
app.use((req, res) => {
  res.status(404).json({
    pesan: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// Penangkap error global (termasuk JSON body yang rusak)
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ pesan: "Format JSON tidak valid" });
  }
  console.error("Error tidak tertangani:", err);
  res.status(500).json({
    pesan: "Terjadi kesalahan pada server",
    error: err?.message,
  });
});

export default app;