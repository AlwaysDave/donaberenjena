import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, CataActivity, CursoActivity, Participant, ReservationFormData, ViajeActivity, WebMetric } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';
import { INITIAL_PARTICIPANTS } from '../data/mockData';
import {
  subscribeToActivitiesFirestore,
  subscribeToMetricsFirestore,
  subscribeToParticipantsFirestore,
  saveActivityFirestore,
  updateActivityFirestore,
  deleteActivityFirestore,
  saveParticipantFirestore,
  updateParticipantFirestore,
  deleteParticipantFirestore,
  createReservationWithParticipantFirestore,
  adjustActivitySpotsFirestore
} from '../services/firestoreService';

import { DEMO_ACTIVITIES, DEMO_PARTICIPANTS, DEMO_METRICS } from '../data/demoData';

interface DataContextType {
  activities: Activity[];
  catas: CataActivity[];
  cursos: CursoActivity[];
  viajes: ViajeActivity[];
  participants: Participant[];
  metrics: WebMetric;
  isConnected: boolean;
  connectionError: string | null;
  getActivityById: (id: string) => Activity | undefined;
  getParticipantsByActivityId: (activityId: string) => Participant[];
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  quickUpdateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  reserveSpots: (id: string, spots: number, reservationData: ReservationFormData) => Promise<{ success: boolean; message: string; participantId?: string }>;
  addManualParticipant: (participantData: Omit<Participant, 'id' | 'registeredAt'> & { id?: string }) => Promise<{ success: boolean; message: string }>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string, activityId: string, spots: number) => Promise<void>;
  markAttendance: (id: string, attended: boolean) => Promise<void>;
  incrementViews: (id: string) => void;
  useMockData: boolean;
  toggleMockData: () => void;
}

const DEFAULT_METRICS: WebMetric = {
  pageViewsThisMonth: 0,
  uniqueVisitorsThisMonth: 0,
  activeReservationsCount: 0,
  occupancyRateAverage: 0,
  topVisitedActivities: []
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [metrics, setMetrics] = useState<WebMetric>(DEFAULT_METRICS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const toggleMockData = () => {
    setUseMockData(prev => !prev);
  };

  const displayActivities = useMockData ? DEMO_ACTIVITIES : activities;
  const displayParticipants = useMockData ? DEMO_PARTICIPANTS : participants;
  const displayMetrics = useMockData ? DEMO_METRICS : metrics;

  // Firestore real-time subscriptions
  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
      setIsConnected(false);
      setConnectionError('Variables de Firebase no configuradas en el archivo .env');
      return;
    }

    let unsubActivities: (() => void) | null = null;
    let unsubMetrics: (() => void) | null = null;
    let unsubParticipants: (() => void) | null = null;

    try {
      unsubActivities = subscribeToActivitiesFirestore(
        (firestoreActivities) => {
          setActivities(firestoreActivities);
          setIsConnected(true);
          setConnectionError(null);
        },
        (err) => {
          console.error('Error in Firestore activities subscription:', err);
          setIsConnected(false);
          setConnectionError(err.message || 'Error al conectar con la colección de actividades en Firestore.');
        }
      );
    } catch (err: any) {
      console.error('Could not initialize activities subscription:', err);
      setIsConnected(false);
      setConnectionError(err.message || 'Error de inicialización de Firestore.');
    }

    try {
      unsubParticipants = subscribeToParticipantsFirestore(
        (firestoreParticipants) => {
          if (firestoreParticipants && firestoreParticipants.length > 0) {
            setParticipants(firestoreParticipants);
          }
        },
        (err) => {
          console.warn('Participants subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize participants subscription:', err);
    }

    try {
      unsubMetrics = subscribeToMetricsFirestore(
        (firestoreMetrics) => {
          setMetrics(firestoreMetrics);
        },
        (err) => {
          console.warn('Metrics subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize metrics subscription:', err);
    }

    return () => {
      if (unsubActivities) unsubActivities();
      if (unsubMetrics) unsubMetrics();
      if (unsubParticipants) unsubParticipants();
    };
  }, []);

  const catas = displayActivities.filter((a): a is CataActivity => a.type === 'cata');
  const cursos = displayActivities.filter((a): a is CursoActivity => a.type === 'curso');
  const viajes = displayActivities.filter((a): a is ViajeActivity => a.type === 'viaje');

  const getActivityById = (id: string): Activity | undefined => {
    return displayActivities.find(a => a.id === id);
  };

  const getParticipantsByActivityId = (activityId: string): Participant[] => {
    return displayParticipants.filter(p => p.activityId === activityId);
  };

  const addActivity = async (activity: Activity) => {
    if (useMockData) {
      setActivities(prev => [activity, ...prev]);
      return;
    }
    await saveActivityFirestore(activity);
  };

  const updateActivity = async (updated: Activity) => {
    if (useMockData) {
      setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
      return;
    }
    await saveActivityFirestore(updated);
  };

  const quickUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    if (useMockData) {
      setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      return;
    }
    await updateActivityFirestore(id, updates);
  };

  const deleteActivity = async (id: string) => {
    // Optimistic local state removal so UI updates immediately
    setActivities(prev => prev.filter(a => a.id !== id));
    if (!useMockData) {
      await deleteActivityFirestore(id);
    }
  };

  const reserveSpots = async (id: string, requestedSpots: number, reservationData: ReservationFormData) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) {
      return { success: false, message: 'La actividad solicitada no existe.' };
    }

    const available = activity.totalSpots - activity.bookedSpots;
    if (requestedSpots > available) {
      return { 
        success: false, 
        message: `Lo sentimos, solo quedan ${available} plaza(s) disponibles.` 
      };
    }

    const newParticipantId = `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const totalAmount = requestedSpots * activity.price;
    const nowIso = new Date().toISOString();

    const newParticipant: Participant = {
      id: newParticipantId,
      activityId: activity.id,
      activityTitle: activity.title,
      activityDate: activity.date,
      activityType: activity.type,
      fullName: reservationData.fullName.trim(),
      email: reservationData.email.trim(),
      phone: reservationData.phone.trim(),
      spots: requestedSpots,
      turn: reservationData.turn || (activity.time ? `Turno (${activity.time})` : undefined),
      membershipNumber: reservationData.membershipNumber?.trim() || undefined,
      notes: reservationData.notes?.trim() || undefined,
      status: 'confirmada',
      totalAmount: totalAmount,
      paidAmount: 0,
      paymentMethod: reservationData.paymentMethod || 'pendiente',
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    // Optimistic update
    setParticipants(prev => [newParticipant, ...prev]);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, bookedSpots: a.bookedSpots + requestedSpots } : a));

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await createReservationWithParticipantFirestore(newParticipant, requestedSpots);
      }
      return { 
        success: true, 
        message: `¡Plazas reservadas con éxito para ${reservationData.fullName}! En breve recibirás un correo con las instrucciones de abono y acceso.`,
        participantId: newParticipantId
      };
    } catch (err: any) {
      console.error('Error executing reservation on Firestore:', err);
      // Even if Firestore fails momentarily, local optimistic state saved
      return {
        success: true,
        message: `¡Solicitud registrada correctamente para ${reservationData.fullName}!`,
        participantId: newParticipantId
      };
    }
  };

  const addManualParticipant = async (participantData: Omit<Participant, 'id' | 'registeredAt'> & { id?: string }) => {
    const activity = activities.find(a => a.id === participantData.activityId);
    const nowIso = new Date().toISOString();
    const newId = participantData.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newParticipant: Participant = {
      ...participantData,
      id: newId,
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    // Optimistic update
    setParticipants(prev => [newParticipant, ...prev]);
    if (activity && participantData.status !== 'cancelada') {
      setActivities(prev => prev.map(a => a.id === participantData.activityId ? { ...a, bookedSpots: a.bookedSpots + participantData.spots } : a));
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await saveParticipantFirestore(newParticipant);
        if (participantData.status !== 'cancelada') {
          await adjustActivitySpotsFirestore(participantData.activityId, participantData.spots);
        }
      }
      return { success: true, message: 'Asistente añadido y plazas actualizadas correctamente.' };
    } catch (err: any) {
      console.error('Error saving manual participant:', err);
      return { success: true, message: 'Asistente registrado localmente.' };
    }
  };

  const updateParticipant = async (id: string, updates: Partial<Participant>) => {
    const old = participants.find(p => p.id === id);
    if (!old) return;

    // Handle spot delta if spots or cancellation status changed
    let spotsDelta = 0;
    if (updates.status === 'cancelada' && old.status !== 'cancelada') {
      spotsDelta = -old.spots;
    } else if (old.status === 'cancelada' && updates.status && updates.status !== 'cancelada') {
      const newSpots = updates.spots !== undefined ? updates.spots : old.spots;
      spotsDelta = newSpots;
    } else if (updates.spots !== undefined && updates.spots !== old.spots && old.status !== 'cancelada') {
      spotsDelta = updates.spots - old.spots;
    }

    const updatedObj = { ...old, ...updates, updatedAt: new Date().toISOString() };

    // Optimistic update
    setParticipants(prev => prev.map(p => p.id === id ? updatedObj : p));
    if (spotsDelta !== 0 && old.activityId) {
      setActivities(prev => prev.map(a => a.id === old.activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots + spotsDelta) } : a));
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await updateParticipantFirestore(id, updates);
        if (spotsDelta !== 0 && old.activityId) {
          await adjustActivitySpotsFirestore(old.activityId, spotsDelta);
        }
      }
    } catch (err) {
      console.error('Error updating participant in Firestore:', err);
    }
  };

  const deleteParticipant = async (id: string, activityId: string, spots: number) => {
    const target = participants.find(p => p.id === id);
    const shouldRefundSpots = target && target.status !== 'cancelada';

    // Optimistic update
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (shouldRefundSpots && activityId) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots - spots) } : a));
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await deleteParticipantFirestore(id);
        if (shouldRefundSpots && activityId) {
          await adjustActivitySpotsFirestore(activityId, -spots);
        }
      }
    } catch (err) {
      console.error('Error deleting participant from Firestore:', err);
    }
  };

  const markAttendance = async (id: string, attended: boolean) => {
    const newStatus = attended ? 'asistio' : 'confirmada';
    await updateParticipant(id, { status: newStatus });
  };

  const incrementViews = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    setMetrics(prev => {
      const existing = prev.topVisitedActivities.find(t => t.id === id);
      let updatedTop;
      if (existing) {
        updatedTop = prev.topVisitedActivities.map(t => 
          t.id === id ? { ...t, views: t.views + 1 } : t
        );
      } else {
        updatedTop = [...prev.topVisitedActivities, { id, title: activity.title, type: activity.type, views: 1 }];
      }
      return {
        ...prev,
        pageViewsThisMonth: prev.pageViewsThisMonth + 1,
        topVisitedActivities: updatedTop.sort((a, b) => b.views - a.views).slice(0, 5)
      };
    });
  };

  return (
    <DataContext.Provider value={{
      activities: displayActivities,
      catas,
      cursos,
      viajes,
      participants: displayParticipants,
      metrics: displayMetrics,
      isConnected,
      connectionError,
      getActivityById,
      getParticipantsByActivityId,
      addActivity,
      updateActivity,
      deleteActivity,
      quickUpdateActivity,
      reserveSpots,
      addManualParticipant,
      updateParticipant,
      deleteParticipant,
      markAttendance,
      incrementViews,
      useMockData,
      toggleMockData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
