import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import kelasRoutes from "./routes/kelas.js";
import catatanRoutes from "./routes/catatan.js";
import notifRoutes from "./routes/notifications.js";

const app = express();

// Middleware CORS agar frontend di web browser dan Expo Go (Android/iOS) tidak terblokir
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/tasks", taskRoutes);
app.use("/api/tasks", taskRoutes); // alias kompatibilitas
app.use("/api/auth", authRoutes);
app.use("/api/kelas", kelasRoutes);
app.use("/api/catatan", catatanRoutes);
app.use("/api/notifications", notifRoutes);

app.get("/", (req, res) => {
  res.json({
    pesan: "Server Tasky berjalan dengan baik!",
    status: "online",
    waktu: new Date().toISOString(),
  });
});

export default app;
