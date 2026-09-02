import { AcquisitionMetrics, MetricPeriodType } from '../types';
import { getAdminAuthHeader } from './authHelper';

export async function fetchAcquisitionMetrics(
  period: MetricPeriodType = '30d',
  token?: string,
  startDate?: string,
  endDate?: string
): Promise<AcquisitionMetrics> {
  const params = new URLSearchParams({ period });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const authHeaders = await getAdminAuthHeader();
  const headers: Record<string, string> = { ...authHeaders };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/metrics/acquisition?${params.toString()}`, {
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Error ${res.status}: Fallo al recuperar las métricas de captación`);
  }

  return await res.json();
}

