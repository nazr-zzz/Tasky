import express from "express";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(express.json());

app.use("/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    pesan: "Server Tasky berjalan dengan baik!",
  });
});

export default app;
