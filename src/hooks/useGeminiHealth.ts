import { useState, useEffect, useRef } from 'react';

export function useGeminiHealth() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const checkHealth = async () => {
      // Don't run if tab is hidden, if component is unmounted, or if a check is already in-flight
      if (!mounted || document.visibilityState !== 'visible' || isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;
      setStatus('checking');

      // Abort previous pending request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const start = performance.now();
      try {
        const res = await fetch('/api/health/gemini', {
          signal: controller.signal
        });

        if (!mounted) return;
        const end = performance.now();
        setLatency(Math.round(end - start));
        setLastChecked(new Date());

        if (res.ok) {
          setStatus('ok');
          setErrorMsg(null);
        } else {
          setStatus('error');
          setErrorMsg(`Error HTTP ${res.status}`);
        }
      } catch (err: any) {
        if (!mounted) return;
        if (err.name === 'AbortError') {
          return;
        }
        setStatus('error');
        setErrorMsg(err.message || 'Error de red');
      } finally {
        if (mounted) {
          isCheckingRef.current = false;
        }
      }
    };

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(checkHealth, 30000); // 30s cadence
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isCheckingRef.current = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkHealth();
        startInterval();
      } else {
        stopInterval();
      }
    };

    // Initial check and interval startup if visible
    if (document.visibilityState === 'visible') {
      checkHealth();
      startInterval();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { status, latency, lastChecked, errorMsg };
}

