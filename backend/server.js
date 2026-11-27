import "./env.js"; // HARUS paling atas
import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Tasky berjalan di http://0.0.0.0:${PORT}`);
  console.log(`Akses lokal / web: http://localhost:${PORT}`);
  console.log(`Akses dari perangkat mobile (LAN): http://192.168.100.81:${PORT}`);
});