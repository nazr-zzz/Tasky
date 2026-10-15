import express from "express";
import taskRoutes from "./routes/tasks.js";

const app = express();

// 1. Middleware wajib agar Express bisa membaca data format JSON dari POST/PUT request
app.use(express.json());

// 2. Daftarkan router untuk endpoint /tasks
app.use("/tasks", taskRoutes);

// 3. Route dasar untuk tes server
app.get("/", (req, res) => {
  res.json({ pesan: "Server Tasky berjalan dengan baik!" });
});

export default app;
