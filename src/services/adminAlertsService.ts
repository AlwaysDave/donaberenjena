import { Activity, Participant, Member, ContactMessage } from '../types';
import { isActivityConcluded, isActivityTodayOrPast } from './participantTransitions';

export type AlertSeverity = 'important' | 'attention' | 'info';

export type AlertType = 
  | 'member-mismatch'
  | 'empty-activity'
  | 'unread-contact'
  | 'waitlist-space'
  | 'attendance-open';

export interface AdminAlert {
  id: string; // Clave de deduplicación estable
  dedupeKey: string;
  type: AlertType;
  severity: AlertSeverity;
  severityLabel: string;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  responsibleRole: string;
  resolutionCriteria: string;
  entityType: 'participant' | 'activity' | 'contactMessage';
  entityId: string;
  activityId?: string;
  participantId?: string;
  contactMessageId?: string;
  actionLabel: string;
  actionTarget: {
    tab: 'gestion' | 'participantes' | 'historico' | 'socios' | 'celebradas' | 'cuentas' | 'contacto';
    activityId?: string;
    searchQuery?: string;
    participantId?: string;
  };
  detectedAt: string;
  sortTimestamp: number;
}

/**
 * Calculates active real-time alerts based on actual system data according to Punto 8.
 * Pure function: deterministic, idempotent, and produces no side effects or duplicates.
 */
export function computeAdminAlerts({
  activities,
  participants,
  members,
  contactMessages,
  isDemoMode = false
}: {
  activities: Activity[];
  participants: Participant[];
  members: Member[];
  contactMessages: ContactMessage[];
  isDemoMode?: boolean;
}): AdminAlert[] {
  const alerts: AdminAlert[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Active member numbers set for O(1) matching
  const activeMemberNumbers = new Set(
    members
      .filter(m => m.active && m.membershipNumber && m.membershipNumber.trim().length > 0)
      .map(m => m.membershipNumber!.trim().toLowerCase())
  );

  // --------------------------------------------------------------------------
  // 1. Persona inscrita como socia sin coincidencia válida
  // Disparador: participante activo o en lista de espera con isMember: true pero sin número válido
  // Clave: member-mismatch:{participantId}
  // Severidad: Atención
  // Responsable: Administración / Socios
  // --------------------------------------------------------------------------
  participants.forEach(p => {
    // Solo evaluar participantes no cancelados
    if (p.status === 'cancelada') return;

    if (p.isMember) {
      const num = (p.membershipNumber || '').trim().toLowerCase();
      const hasValidMatch = num.length > 0 && activeMemberNumbers.has(num);

      if (!hasValidMatch) {
        const dedupKey = `member-mismatch:${p.id}`;
        alerts.push({
          id: dedupKey,
          dedupeKey: dedupKey,
          type: 'member-mismatch',
          severity: 'attention',
          severityLabel: 'Atención',
          title: 'Inscrito como socio sin coincidencia en Censo',
          whatHappened: `"${p.fullName}" figura inscrito como socio en "${p.activityTitle || 'Actividad'}" pero su carné "${p.membershipNumber || 'No indicado'}" no coincide con ningún socio activo del Censo.`,
          whyItMatters: 'Puede haberse aplicado la tarifa reducida indebidamente o requerir la actualización manual de su número de socio.',
          responsibleRole: 'Administración / Socios',
          resolutionCriteria: 'Se resolverá automáticamente al corregir el número de socio en su ficha, desmarcarlo como socio o cancelar la inscripción.',
          entityType: 'participant',
          entityId: p.id,
          participantId: p.id,
          activityId: p.activityId,
          actionLabel: 'Ver en Control de Asistencia',
          actionTarget: {
            tab: 'participantes',
            activityId: p.activityId,
            searchQuery: p.fullName,
            participantId: p.id
          },
          detectedAt: p.registeredAt || p.createdAt || todayStr,
          sortTimestamp: new Date(p.registeredAt || p.createdAt || todayStr).getTime()
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // 2. Actividad sin reservas a 15 días
  // Disparador: actividad futura y activa cuya fecha está a 15 días o menos, con 0 plazas ocupadas
  // Exclusiones: canceladas, archivadas, celebradas, o a > 15 días
  // Clave: empty-activity:{activityId}
  // Severidad: Atención
  // Responsable: Organización
  // --------------------------------------------------------------------------
  activities.forEach(act => {
    if (act.status === 'celebrada') return;
    if (!act.date) return;

    // Calcular días restantes hasta la actividad
    const actDate = new Date(`${act.date}T00:00:00`);
    const todayDate = new Date(`${todayStr}T00:00:00`);
    const diffTime = actDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Solo actividades futuras a 15 días o menos (diffDays entre 0 y 15)
    if (diffDays >= 0 && diffDays <= 15) {
      // Contar plazas ocupadas reales (pendiente_pago, pagada, asistio)
      const booked = act.bookedSpots || 0;
      if (booked === 0) {
        const dedupKey = `empty-activity:${act.id}`;
        alerts.push({
          id: dedupKey,
          dedupeKey: dedupKey,
          type: 'empty-activity',
          severity: 'attention',
          severityLabel: 'Atención',
          title: 'Actividad sin reservas a 15 días',
          whatHappened: `La actividad "${act.title}" programada para el ${act.date} (${diffDays === 0 ? '¡Hoy!' : `en ${diffDays} día${diffDays > 1 ? 's' : ''}`}) no tiene ninguna plaza reservada.`,
          whyItMatters: 'Permite a la junta evaluar campañas de difusión, cambio de fecha o suspensión preventiva antes de incurrir en gastos logísticos.',
          responsibleRole: 'Organización',
          resolutionCriteria: 'Se resolverá automáticamente al registrarse la primera reserva, al marcar la actividad como celebrada o al cancelar/archivar la actividad.',
          entityType: 'activity',
          entityId: act.id,
          activityId: act.id,
          actionLabel: 'Ver Actividad en Próximas',
          actionTarget: {
            tab: 'gestion',
            activityId: act.id
          },
          detectedAt: act.date,
          sortTimestamp: actDate.getTime()
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Nuevo mensaje de contacto sin revisar
  // Disparador: registro en contactMessages pendiente de revisión (!read o status === 'nuevo')
  // Clave: unread-contact:{messageId}
  // Severidad: Información
  // Responsable: Comunicación
  // --------------------------------------------------------------------------
  contactMessages.forEach(msg => {
    if (!msg.read || msg.status === 'nuevo') {
      const dedupKey = `unread-contact:${msg.id}`;
      alerts.push({
        id: dedupKey,
        dedupeKey: dedupKey,
        type: 'unread-contact',
        severity: 'info',
        severityLabel: 'Información',
        title: 'Mensaje de contacto sin revisar',
        whatHappened: `Mensaje recibido de "${msg.name}" (${msg.email}) con el asunto "${msg.subject || 'Consulta'}".`,
        whyItMatters: 'Atención al socio y resolución de dudas sobre inscripciones o actividades antes de que caduquen.',
        responsibleRole: 'Comunicación',
        resolutionCriteria: 'Se resolverá al abrir el mensaje en el módulo de Contacto y marcarlo como revisado o respondido.',
        entityType: 'contactMessage',
        entityId: msg.id,
        contactMessageId: msg.id,
        actionLabel: 'Abrir en Bandeja de Contacto',
        actionTarget: {
          tab: 'contacto',
          searchQuery: msg.name
        },
        detectedAt: msg.createdAt || todayStr,
        sortTimestamp: new Date(msg.createdAt || todayStr).getTime()
      });
    }
  });

  // --------------------------------------------------------------------------
  // 4. Lista de espera con plaza disponible
  // Disparador: actividad futura con >= 1 persona en lista_de_espera y aforo libre (bookedSpots < totalSpots)
  // Clave: waitlist-space:{activityId}
  // Severidad: Atención
  // Responsable: Organización / Control de Asistencia
  // --------------------------------------------------------------------------
  activities.forEach(act => {
    if (act.status === 'celebrada' || isActivityConcluded(act)) return;

    const waitlistCount = participants.filter(
      p => p.activityId === act.id && p.status === 'lista_de_espera'
    ).length;

    const availableSpots = (act.totalSpots || 0) - (act.bookedSpots || 0);

    if (waitlistCount > 0 && availableSpots > 0) {
      const dedupKey = `waitlist-space:${act.id}`;
      alerts.push({
        id: dedupKey,
        dedupeKey: dedupKey,
        type: 'waitlist-space',
        severity: 'attention',
        severityLabel: 'Atención',
        title: 'Lista de espera con plaza disponible',
        whatHappened: `"${act.title}" tiene ${waitlistCount} persona${waitlistCount > 1 ? 's' : ''} en lista de espera y ${availableSpots} plaza${availableSpots > 1 ? 's' : ''} libre${availableSpots > 1 ? 's' : ''} en el aforo.`,
        whyItMatters: 'Hay plazas liberadas disponibles para contactar y promocionar a los inscritos en cola de espera.',
        responsibleRole: 'Organización / Control de Asistencia',
        resolutionCriteria: 'Se resolverá al promocionar manualmente a los participantes, completarse el aforo o concluir la actividad.',
        entityType: 'activity',
        entityId: act.id,
        activityId: act.id,
        actionLabel: 'Gestionar Lista en Control de Asistencia',
        actionTarget: {
          tab: 'participantes',
          activityId: act.id
        },
        detectedAt: act.date || todayStr,
        sortTimestamp: new Date(`${act.date || todayStr}T00:00:00`).getTime()
      });
    }
  });

  // --------------------------------------------------------------------------
  // 5. Actividad celebrada con asistencia pendiente de cerrar
  // Disparador: actividad que ya ha terminado y conserva participantes en pendiente_pago o pagada
  // Clave: attendance-open:{activityId}
  // Severidad: Importante
  // Responsable: Control de Asistencia
  // --------------------------------------------------------------------------
  activities.forEach(act => {
    const isPast = act.status === 'celebrada' || isActivityConcluded(act) || (act.date && act.date < todayStr);
    if (!isPast) return;

    const pendingParticipants = participants.filter(
      p => p.activityId === act.id && (p.status === 'pendiente_pago' || p.status === 'pagada')
    );

    if (pendingParticipants.length > 0) {
      const dedupKey = `attendance-open:${act.id}`;
      alerts.push({
        id: dedupKey,
        dedupeKey: dedupKey,
        type: 'attendance-open',
        severity: 'important',
        severityLabel: 'Importante',
        title: 'Actividad celebrada con asistencia pendiente de cerrar',
        whatHappened: `"${act.title}" (${act.date}) ya ha concluido y mantiene ${pendingParticipants.length} asistente${pendingParticipants.length > 1 ? 's' : ''} en estado pendiente de pago o pagada sin confirmación de asistencia.`,
        whyItMatters: 'Requiere ejecutar el cierre de asistencia para convertir las ausencias en cancelaciones «No presentado» y cuadrar las cuentas y el histórico de socios.',
        responsibleRole: 'Control de Asistencia',
        resolutionCriteria: 'Se resolverá al pulsar «Cerrar Asistencia» en Control de Asistencia o al registrar la asistencia / cancelación de los participantes pendientes.',
        entityType: 'activity',
        entityId: act.id,
        activityId: act.id,
        actionLabel: 'Cerrar Asistencia en Control de Asistencia',
        actionTarget: {
          tab: 'participantes',
          activityId: act.id
        },
        detectedAt: act.date || todayStr,
        sortTimestamp: new Date(`${act.date || todayStr}T00:00:00`).getTime()
      });
    }
  });

  // --------------------------------------------------------------------------
  // Ordenación canónica:
  // 1. Por severidad: 'important' (1) -> 'attention' (2) -> 'info' (3)
  // 2. Por proximidad temporal / fecha de detección
  // --------------------------------------------------------------------------
  const severityWeight: Record<AlertSeverity, number> = {
    important: 1,
    attention: 2,
    info: 3
  };

  return alerts.sort((a, b) => {
    const wDiff = severityWeight[a.severity] - severityWeight[b.severity];
    if (wDiff !== 0) return wDiff;
    return a.sortTimestamp - b.sortTimestamp;
  });
}
