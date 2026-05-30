export async function withRetry(fn, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (!retryable || attempt === maxAttempts) throw err;

      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.warn(`[LLM] Retry ${attempt}/${maxAttempts} sau ${delay}ms (${err?.status})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}