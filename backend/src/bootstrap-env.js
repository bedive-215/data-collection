/**
 * Nạp .env từ thư mục backend (cạnh package.json), không phụ thuộc cwd.
 * Phải được import dòng đầu tiên từ server.js.
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[env] Không đọc được ${envPath}:`, result.error.message);
} else {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

  console.log(
    `[env] Đã nạp ${envPath} | OPENAI_API_KEY: ${
      hasOpenAI ? "có" : "chưa có"
    }`
  );
}
