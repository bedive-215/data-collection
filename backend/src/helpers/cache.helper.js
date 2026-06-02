import { connection } from "#configs/redis.js";

const safeStringify = (v) => {
  try {
    return JSON.stringify(v);
  } catch {
    return undefined;
  }
};

const safeParse = (s) => {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
};

export const cache = {
  async getJSON(key) {
    const v = await connection.get(key);
    return safeParse(v);
  },

  async setJSON(key, value, ttlSeconds = 60) {
    const str = safeStringify(value);
    if (str === undefined) return;
    if (ttlSeconds && ttlSeconds > 0) {
      await connection.set(key, str, "EX", ttlSeconds);
      return;
    }
    await connection.set(key, str);
  },

  async del(keyOrKeys) {
    if (!keyOrKeys) return;
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (keys.length === 0) return;
    await connection.del(...keys);
  },

  // chống stampede (giản lược): nếu đang lock thì chờ 50-150ms rồi đọc lại
  async getOrSetJSON({
    key,
    ttlSeconds,
    fetcher,
    lockTtlSeconds = Math.min(30, Math.max(5, Math.floor(ttlSeconds / 3))),
    waitMaxMs = 1200,
    waitStepMs = 120,
  }) {
    const cached = await this.getJSON(key);
    if (cached !== undefined) return cached;

    const lockKey = `lock:${key}`;
    const start = Date.now();

    // try acquire lock
    const acquired = await connection.set(lockKey, "1", "NX", "EX", lockTtlSeconds);
    if (acquired) {
      try {
        const fresh = await fetcher();
        if (fresh !== undefined) await this.setJSON(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        await this.del(lockKey);
      }
    }

    // wait until another worker sets it
    while (Date.now() - start < waitMaxMs) {
      await new Promise((r) => setTimeout(r, waitStepMs));
      const again = await this.getJSON(key);
      if (again !== undefined) return again;
    }

    // last resort
    const fresh = await fetcher();
    if (fresh !== undefined) await this.setJSON(key, fresh, ttlSeconds);
    return fresh;
  },
};

