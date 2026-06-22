import { useState, useEffect, useCallback, useRef } from "react";

export function useApi(fetchFn, deps = [], options = {}) {
  const { enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        const message = err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
        setError(message);
        setLoading(false);
        onError?.(err);
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) execute();
    return () => { mountedRef.current = false; };
  }, [execute, enabled]);

  return { data, loading, error, refetch: execute };
}
