import { useState, useEffect, useRef } from 'react';

export type GeminiHealthStatus = 'checking' | 'configured' | 'not_configured' | 'error';

export interface GeminiHealthInfo {
  status: GeminiHealthStatus;
  latency: number | null;
  lastChecked: Date | null;
  errorMsg: string | null;
  message: string | null;
  recheck: () => Promise<void>;
}

export function useGeminiHealth(): GeminiHealthInfo {
  const [status, setStatus] = useState<GeminiHealthStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkHealth = async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setStatus('checking');

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

      const end = performance.now();
      setLatency(Math.round(end - start));
      setLastChecked(new Date());

      if (res.ok) {
        const data = await res.json();
        if (data.configured || data.status === 'configured') {
          setStatus('configured');
          setMessage(data.message || 'Configuración disponible (clave de entorno configurada en el servidor)');
          setErrorMsg(null);
        } else {
          setStatus('not_configured');
          setMessage(data.message || 'No configurado (falta GEMINI_API_KEY en el servidor)');
          setErrorMsg(null);
        }
      } else {
        setStatus('error');
        setErrorMsg(`Error HTTP ${res.status}`);
        setMessage(null);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      setStatus('error');
      setErrorMsg(err.message || 'Error de conexión');
      setMessage(null);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    checkHealth();

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(checkHealth, 30000); // 30s cadence
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkHealth();
        startInterval();
      } else {
        stopInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    latency,
    lastChecked,
    errorMsg,
    message,
    recheck: checkHealth
  };
}
