import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[env] Không đọc được ${envPath}:`, result.error.message);
} else {
  console.log(`[env] Đã đọc được ${envPath}`);
}
