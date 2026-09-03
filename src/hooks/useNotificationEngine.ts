import React, { useEffect, useRef } from 'react';
import { Activity, Participant, Expense, Member, AdminNotification, NotificationSeverity, NotificationType } from '../types';

interface EngineProps {
  activities: Activity[];
  participants: Participant[];
  expenses: Expense[];
  members: Member[];
  adminNotifications: AdminNotification[];
  setAdminNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  useMockData: boolean;
}

export function useNotificationEngine({
  activities,
  participants,
  expenses,
  members,
  adminNotifications,
  setAdminNotifications,
  useMockData
}: EngineProps) {
  // Prevent infinite loops by keeping track of the last run state string or just running on major changes
  const lastRunRef = useRef(0);

  useEffect(() => {
    // Only run every 5 seconds max to avoid performance hits
    const now = Date.now();
    if (now - lastRunRef.current < 5000) return;
    lastRunRef.current = now;

    const newNotifications: AdminNotification[] = [];
    const nowIso = new Date().toISOString();

    const addNotif = (type: NotificationType, severity: NotificationSeverity, dedupeKey: string, title: string, message: string, activityId?: string, participantId?: string) => {
      // Check if this precise notification already exists
      const exists = adminNotifications.find(n => n.dedupeKey === dedupeKey);
      if (!exists) {
        newNotifications.push({
          id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
          type,
          severity,
          dedupeKey,
          title,
          message,
          activityId,
          participantId,
          read: false,
          createdAt: nowIso
        });
      }
    };

    // 0. Discrepancias de Socios (socio_mismatch)
    if (members.length > 0) {
      participants.forEach(p => {
        if (p.status === 'cancelada') return;
        if (p.isMember) {
          const emailLower = (p.email || '').trim().toLowerCase();
          const nameLower = (p.fullName || '').trim().toLowerCase();
          const memNumTrim = (p.membershipNumber || '').trim().toUpperCase();

          const foundMember = members.find(m => {
            if (!m.active) return false;
            const mEmail = (m.email || '').trim().toLowerCase();
            const mName = (m.fullName || '').trim().toLowerCase();
            const mMemNum = (m.membershipNumber || '').trim().toUpperCase();
            
            if (emailLower && mEmail && emailLower === mEmail) return true;
            if (memNumTrim && mMemNum && memNumTrim === mMemNum) return true;
            if (nameLower && mName && nameLower === mName) return true;
            return false;
          });

          if (!foundMember) {
            const act = activities.find(a => a.id === p.activityId);
            const actTitle = act?.title || 'Actividad';
            addNotif(
              'socio_mismatch',
              'attention',
              `socio_mismatch_${p.id}`,
              'Socio no Encontrado en Censo',
              `"${p.fullName}" (${p.email}) se inscribió con tarifa de socio en "${actTitle}", pero no figura como socio activo en el censo.`,
              p.activityId,
              p.id
            );
          }
        }
      });
    }

    // 1. Ocupación Alta y Baja
    activities.forEach(act => {
      if (act.status === 'celebrada') return; // Only upcoming

      const actParticipants = participants.filter(p => p.activityId === act.id && p.status !== 'cancelada' && p.status !== 'lista_de_espera');
      const booked = actParticipants.length;
      const total = act.totalSpots || 14;
      const pct = booked / total;

      if (pct >= 1) {
        addNotif('ocupacion_alta', 'attention', `ocup_100_${act.id}`, 'Aforo Completo', `La actividad "${act.title}" ha alcanzado el 100% de aforo (${booked}/${total}).`, act.id);
      } else if (pct >= 0.9) {
        addNotif('ocupacion_alta', 'info', `ocup_90_${act.id}`, 'Aforo al 90%', `La actividad "${act.title}" está casi llena (${booked}/${total} reservas).`, act.id);
      } else if (pct >= 0.8) {
        addNotif('ocupacion_alta', 'info', `ocup_80_${act.id}`, 'Aforo al 80%', `La actividad "${act.title}" supera el 80% de reservas (${booked}/${total}).`, act.id);
      } else if (pct <= 0.2 && total > 0 && new Date(act.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
        // Less than 20% and less than 7 days left
        addNotif('ocupacion_baja', 'important', `ocup_low_${act.id}`, 'Baja Ocupación Próxima', `La actividad "${act.title}" está a menos de 7 días y solo tiene ${booked} reservas (menos del 20%).`, act.id);
      }

      // 8. Plaza liberada con lista de espera
      const cancelled = participants.filter(p => p.activityId === act.id && p.status === 'cancelada');
      const waiting = participants.filter(p => p.activityId === act.id && p.status === 'lista_de_espera');
      if (cancelled.length > 0 && waiting.length > 0 && booked < total) {
        addNotif('plaza_liberada', 'attention', `plaza_lib_${act.id}_${booked}`, 'Plaza Liberada', `La actividad "${act.title}" tiene plazas disponibles (${total - booked}) y hay ${waiting.length} persona(s) en lista de espera.`, act.id);
      }

      // 9. Aforo discrepancia (solo warning)
      if (booked > total) {
        addNotif('aforo_discrepancia', 'critical', `aforo_disc_${act.id}_${booked}`, 'Sobre-aforo Detectado', `La actividad "${act.title}" tiene más reservas (${booked}) que plazas disponibles (${total}).`, act.id);
      }

      // 10. Info incompleta (without locations, pricing)
      if (!act.location || act.priceMember === undefined) {
        addNotif('info_incompleta', 'info', `info_inc_${act.id}`, 'Información Incompleta', `La actividad "${act.title}" carece de ubicación o precios definidos.`, act.id);
      }
    });

    // 4 & 7. Actividad Pasada
    activities.filter(a => a.status === 'celebrada').forEach(act => {
      const actExpenses = expenses.filter(e => e.activityId === act.id);
      if (actExpenses.length === 0) {
        addNotif('sin_gastos', 'important', `sin_gastos_${act.id}`, 'Actividad sin Gastos', `La actividad pasada "${act.title}" no tiene ningún gasto registrado en contabilidad.`, act.id);
      }

      const totalIngresos = participants.filter(p => p.activityId === act.id && p.status !== 'cancelada').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const totalGastos = actExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      if (totalGastos > totalIngresos && totalGastos > 0) {
        addNotif('balance_negativo', 'attention', `bal_neg_${act.id}`, 'Balance Negativo', `La actividad "${act.title}" arrojó pérdidas (${(totalIngresos - totalGastos).toFixed(2)}€).`, act.id);
      }
    });

    // 5. Gastos sin comprobante
    expenses.forEach(exp => {
      if (!exp.receiptImageUrl && exp.amount > 50) { // arbitrary threshold for anomalo
        addNotif('gasto_sin_comprobante', 'attention', `gasto_sin_comp_${exp.id}`, 'Gasto sin Comprobante', `Se registró un gasto de ${exp.amount}€ (${exp.concept}) sin adjuntar factura o comprobante.`, exp.activityId);
      }
    });

    if (newNotifications.length > 0) {
      setAdminNotifications(prev => [...newNotifications, ...prev]);
    }

  }, [activities, participants, expenses, members, adminNotifications, setAdminNotifications]);

}
