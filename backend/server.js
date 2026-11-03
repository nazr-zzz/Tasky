import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Tasky berjalan di http://0.0.0.0:${PORT}`);
  console.log(`Akses lokal / web: http://localhost:${PORT}`);
  console.log(`Akses dari perangkat mobile (LAN): http://192.168.100.81:${PORT}`);
});
