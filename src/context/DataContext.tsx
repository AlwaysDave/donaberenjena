import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, AdminNotification, CataActivity, CursoActivity, Member, Participant, ReservationFormData, ViajeActivity, WebMetric, Expense, Sponsorship } from '../types';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../services/firebase';
import { INITIAL_PARTICIPANTS } from '../data/mockData';
import { DEMO_ACTIVITIES, DEMO_PARTICIPANTS, DEMO_MEMBERS, DEMO_NOTIFICATIONS, DEMO_METRICS, DEMO_EXPENSES, DEMO_SPONSORSHIPS } from '../data/demoData';
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
  createReservationWithParticipantsFirestore,
  adjustActivitySpotsFirestore,
  subscribeToMembersFirestore,
  saveMemberFirestore,
  updateMemberFirestore,
  deleteMemberFirestore,
  subscribeToAdminNotificationsFirestore,
  subscribeToExpensesFirestore,
  saveExpenseFirestore,
  updateExpenseFirestore,
  deleteExpenseFirestore,
  subscribeToSponsorshipsFirestore,
  saveSponsorshipFirestore,
  updateSponsorshipFirestore,
  deleteSponsorshipFirestore,
  saveAdminNotificationFirestore,
  markAdminNotificationReadFirestore,
  deleteAdminNotificationFirestore
} from '../services/firestoreService';

interface DataContextType {
  activities: Activity[];
  catas: CataActivity[];
  cursos: CursoActivity[];
  viajes: ViajeActivity[];
  participants: Participant[];
  members: Member[];
  adminNotifications: AdminNotification[];
  expenses: Expense[];
  sponsorships: Sponsorship[];
  unreadNotificationsCount: number;
  metrics: WebMetric;
  isConnected: boolean;
  connectionError: string | null;
  getActivityById: (id: string) => Activity | undefined;
  getParticipantsByActivityId: (activityId: string) => Participant[];
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  quickUpdateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  reserveSpots: (id: string, spots: number, reservationData: ReservationFormData) => Promise<{ success: boolean; message: string; groupId?: string }>;
  addManualParticipant: (participantData: Omit<Participant, 'id' | 'registeredAt'> & { id?: string }) => Promise<{ success: boolean; message: string }>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string, activityId: string, _legacySpots?: number) => Promise<void>;
  markAttendance: (id: string, attended: boolean) => Promise<void>;
  incrementViews: (id: string) => void;
  // Member management
  addMember: (memberData: Omit<Member, 'id' | 'createdAt'> & { id?: string }) => Promise<{ success: boolean; message: string }>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  importMembers: (newMembers: Omit<Member, 'id' | 'createdAt'>[]) => Promise<{ imported: number; skipped: number }>;
  // Notifications
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (notif: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  // Expenses
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Sponsorships
  addSponsorship: (sponsorshipData: Omit<Sponsorship, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateSponsorship: (id: string, updates: Partial<Sponsorship>) => Promise<void>;
  deleteSponsorship: (id: string) => Promise<void>;
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

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [metrics, setMetrics] = useState<WebMetric>(DEFAULT_METRICS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [demoActivities, setDemoActivities] = useState<Activity[]>(DEMO_ACTIVITIES);
  const [demoParticipants, setDemoParticipants] = useState<Participant[]>(DEMO_PARTICIPANTS);
  const [demoMembers, setDemoMembers] = useState<Member[]>(DEMO_MEMBERS);
  const [demoNotifications, setDemoNotifications] = useState<AdminNotification[]>(DEMO_NOTIFICATIONS);
  const [demoExpenses, setDemoExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [demoSponsorships, setDemoSponsorships] = useState<Sponsorship[]>(DEMO_SPONSORSHIPS);
  const [demoMetrics, setDemoMetrics] = useState<WebMetric>(DEMO_METRICS);

  const toggleMockData = () => {
    setUseMockData(prev => !prev);
  };

  const displayActivities = useMockData ? demoActivities : activities;
  const displayParticipants = useMockData ? demoParticipants : participants;
  const displayMembers = useMockData ? demoMembers : members;
  const displayNotifications = useMockData ? demoNotifications : adminNotifications;
  const displayExpenses = useMockData ? demoExpenses : expenses;
  const displaySponsorships = useMockData ? demoSponsorships : sponsorships;
  const displayMetrics = useMockData ? demoMetrics : metrics;

  const unreadNotificationsCount = displayNotifications.filter(n => !n.read).length;

  // Public real-time subscriptions (activities and metrics)
  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
      setIsConnected(false);
      setConnectionError('Variables de Firebase no configuradas en el archivo .env');
      return;
    }

    let unsubActivities: (() => void) | null = null;
    let unsubMetrics: (() => void) | null = null;

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
    };
  }, []);

  // Protected real-time subscription: participants, members, notifications, expenses, sponsorships (only active when admin is authenticated)
  useEffect(() => {
    if (!isAuthenticated || useMockData || !isFirebaseConfigured() || !db) {
      if (!useMockData && !isAuthenticated) {
        setParticipants([]);
        setMembers([]);
        setAdminNotifications([]);
        setExpenses([]);
        setSponsorships([]);
      }
      return;
    }

    let unsubParticipants: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;
    let unsubExpenses: (() => void) | null = null;
    let unsubSponsorships: (() => void) | null = null;

    try {
      unsubParticipants = subscribeToParticipantsFirestore(
        (firestoreParticipants) => {
          if (firestoreParticipants) {
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
      unsubMembers = subscribeToMembersFirestore(
        (firestoreMembers) => {
          if (firestoreMembers) {
            setMembers(firestoreMembers);
          }
        },
        (err) => {
          console.warn('Members subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize members subscription:', err);
    }

    try {
      unsubNotifications = subscribeToAdminNotificationsFirestore(
        (firestoreNotifs) => {
          if (firestoreNotifs) {
            setAdminNotifications(firestoreNotifs);
          }
        },
        (err) => {
          console.warn('Admin notifications subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize notifications subscription:', err);
    }

    try {
      unsubExpenses = subscribeToExpensesFirestore(
        (firestoreExpenses) => {
          if (firestoreExpenses) {
            setExpenses(firestoreExpenses);
          }
        },
        (err) => {
          console.warn('Expenses subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize expenses subscription:', err);
    }

    try {
      unsubSponsorships = subscribeToSponsorshipsFirestore(
        (firestoreSponsorships) => {
          if (firestoreSponsorships) {
            setSponsorships(firestoreSponsorships);
          }
        },
        (err) => {
          console.warn('Sponsorships subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize sponsorships subscription:', err);
    }

    return () => {
      if (unsubParticipants) unsubParticipants();
      if (unsubMembers) unsubMembers();
      if (unsubNotifications) unsubNotifications();
      if (unsubExpenses) unsubExpenses();
      if (unsubSponsorships) unsubSponsorships();
    };
  }, [isAuthenticated, useMockData]);

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
  };  const reserveSpots = async (id: string, requestedSpots: number, reservationData: ReservationFormData) => {
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

    const groupId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `grp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const nowIso = new Date().toISOString();
    const priceMember = activity.priceMember;
    const priceNonMember = activity.priceNonMember;
    const turnText = reservationData.turn || (activity.time ? `Turno (${activity.time})` : undefined);

    const newParticipants: Participant[] = [];

    // 1. Titular (First attendee)
    const isTitularMember = reservationData.isMember ?? (reservationData.attendees?.[0]?.isMember ?? false);
    const titularPrice = isTitularMember ? priceMember : priceNonMember;
    const titularId = `part-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`;

    newParticipants.push({
      id: titularId,
      activityId: activity.id,
      activityTitle: activity.title,
      activityDate: activity.date,
      activityType: activity.type,
      fullName: reservationData.fullName.trim(),
      email: reservationData.email.trim(),
      phone: reservationData.phone.trim(),
      isMember: isTitularMember,
      groupId,
      turn: turnText,
      membershipNumber: reservationData.membershipNumber?.trim() || undefined,
      notes: reservationData.notes?.trim() || undefined,
      status: 'confirmada',
      totalAmount: titularPrice,
      paidAmount: 0,
      paymentMethod: reservationData.paymentMethod || 'pendiente',
      registeredAt: nowIso,
      updatedAt: nowIso
    });

    // 2. Companions (Plazas 2..N)
    for (let i = 1; i < requestedSpots; i++) {
      const compData = reservationData.attendees?.[i];
      const isCompMember = !!compData?.isMember;
      const compPrice = isCompMember ? priceMember : priceNonMember;
      const compId = `part-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

      newParticipants.push({
        id: compId,
        activityId: activity.id,
        activityTitle: activity.title,
        activityDate: activity.date,
        activityType: activity.type,
        fullName: compData?.fullName?.trim() || `Acompañante ${i} (${reservationData.fullName.trim()})`,
        email: compData?.email?.trim() || '',
        phone: compData?.phone?.trim() || '',
        isMember: isCompMember,
        groupId,
        turn: turnText,
        membershipNumber: compData?.membershipNumber?.trim() || undefined,
        notes: compData?.notes?.trim() || undefined,
        status: 'confirmada',
        totalAmount: compPrice,
        paidAmount: 0,
        paymentMethod: reservationData.paymentMethod || 'pendiente',
        registeredAt: nowIso,
        updatedAt: nowIso
      });
    }

    // Optimistic update
    setParticipants(prev => [...newParticipants, ...prev]);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, bookedSpots: a.bookedSpots + requestedSpots } : a));

    // Contrast check against members census (Prompt 4, Req 3)
    const activeCensus = displayMembers;
    for (const p of newParticipants) {
      const normalizedPName = normalizeText(p.fullName);
      const matchedMember = activeCensus.find(m => {
        if (p.email && m.email && m.email.toLowerCase().trim() === p.email.toLowerCase().trim()) return true;
        return normalizeText(m.fullName) === normalizedPName;
      });

      if (p.isMember) {
        if (!matchedMember || !matchedMember.active) {
          const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const notif: AdminNotification = {
            id: notifId,
            type: 'socio_mismatch',
            message: `Aviso de reserva: "${p.fullName}" se indicó como SOCIO para "${p.activityTitle}", pero no figura en el censo activo de socios.`,
            activityId: p.activityId,
            participantId: p.id,
            read: false,
            createdAt: nowIso
          };
          setAdminNotifications(prev => [notif, ...prev]);
          if (!useMockData && isFirebaseConfigured() && db) {
            saveAdminNotificationFirestore(notif).catch(e => console.warn('Could not save notification:', e));
          }
        }
      } else {
        if (matchedMember && matchedMember.active) {
          const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const notif: AdminNotification = {
            id: notifId,
            type: 'socio_mismatch',
            message: `Aviso de reserva: "${p.fullName}" se registró como NO SOCIO para "${p.activityTitle}", pero figura como socio activo (${matchedMember.membershipNumber || 'S/N'}). Se le podría haber cobrado tarifa general.`,
            activityId: p.activityId,
            participantId: p.id,
            read: false,
            createdAt: nowIso
          };
          setAdminNotifications(prev => [notif, ...prev]);
          if (!useMockData && isFirebaseConfigured() && db) {
            saveAdminNotificationFirestore(notif).catch(e => console.warn('Could not save notification:', e));
          }
        }
      }
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await createReservationWithParticipantsFirestore(newParticipants, activity.id);
      }
      return { 
        success: true, 
        message: `¡Plazas reservadas con éxito para ${reservationData.fullName}! En breve recibirás un correo con las instrucciones de abono y acceso.`,
        groupId
      };
    } catch (err: any) {
      console.error('Error executing reservation on Firestore:', err);
      // Even if Firestore fails momentarily, local optimistic state saved
      return { 
        success: true, 
        message: `¡Solicitud registrada correctamente para ${reservationData.fullName}!`,
        groupId
      };
    }
  };

  const addManualParticipant = async (participantData: Omit<Participant, 'id' | 'registeredAt'> & { id?: string }) => {
    const activity = activities.find(a => a.id === participantData.activityId);
    const nowIso = new Date().toISOString();
    const newId = participantData.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const groupId = participantData.groupId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grp-manual-${Date.now()}`);

    const newParticipant: Participant = {
      ...participantData,
      id: newId,
      groupId,
      isMember: !!participantData.isMember,
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    const isConsumingSpot = participantData.status !== 'cancelada' && participantData.status !== 'lista_de_espera';

    // Optimistic update
    if (useMockData) {
      setDemoParticipants(prev => [newParticipant, ...prev]);
      if (activity && isConsumingSpot) {
        setDemoActivities(prev => prev.map(a => a.id === participantData.activityId ? { ...a, bookedSpots: a.bookedSpots + 1 } : a));
      }
      return { success: true, message: 'Asistente añadido en modo demo.' };
    }

    setParticipants(prev => [newParticipant, ...prev]);
    if (activity && isConsumingSpot) {
      setActivities(prev => prev.map(a => a.id === participantData.activityId ? { ...a, bookedSpots: a.bookedSpots + 1 } : a));
    }

    // Member contrast check
    const normalizedName = normalizeText(newParticipant.fullName);
    const matchedMember = displayMembers.find(m => {
      if (newParticipant.email && m.email && m.email.toLowerCase().trim() === newParticipant.email.toLowerCase().trim()) return true;
      return normalizeText(m.fullName) === normalizedName;
    });

    if (newParticipant.isMember && (!matchedMember || !matchedMember.active)) {
      const notif: AdminNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'socio_mismatch',
        message: `Aviso manual: "${newParticipant.fullName}" se añadió como SOCIO pero no figura en el censo activo de socios.`,
        activityId: newParticipant.activityId,
        participantId: newParticipant.id,
        read: false,
        createdAt: nowIso
      };
      setAdminNotifications(prev => [notif, ...prev]);
      if (!useMockData && isFirebaseConfigured() && db) {
        saveAdminNotificationFirestore(notif).catch(e => console.warn('Could not save notification:', e));
      }
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await saveParticipantFirestore(newParticipant);
        if (isConsumingSpot) {
          await adjustActivitySpotsFirestore(participantData.activityId, 1);
        }
      }
      return { success: true, message: 'Asistente añadido y plazas actualizadas correctamente.' };
    } catch (err: any) {
      console.error('Error saving manual participant:', err);
      return { success: true, message: 'Asistente registrado localmente.' };
    }
  };

  const updateParticipant = async (id: string, updates: Partial<Participant>) => {
    const list = useMockData ? demoParticipants : participants;
    const old = list.find(p => p.id === id);
    if (!old) return;

    // Handle spot delta if cancellation or waiting list status changed
    const wasOccupying = old.status !== 'cancelada' && old.status !== 'lista_de_espera';
    const willOccupy = updates.status 
      ? (updates.status !== 'cancelada' && updates.status !== 'lista_de_espera')
      : wasOccupying;

    let spotsDelta = 0;
    if (wasOccupying && !willOccupy) {
      spotsDelta = -1;
    } else if (!wasOccupying && willOccupy) {
      spotsDelta = 1;
    }

    const updatedObj = { ...old, ...updates, updatedAt: new Date().toISOString() };

    if (useMockData) {
      setDemoParticipants(prev => prev.map(p => p.id === id ? updatedObj : p));
      if (spotsDelta !== 0 && old.activityId) {
        setDemoActivities(prev => prev.map(a => a.id === old.activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots + spotsDelta) } : a));
      }
      return;
    }

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

  const deleteParticipant = async (id: string, activityId: string, _legacySpots?: number) => {
    const list = useMockData ? demoParticipants : participants;
    const target = list.find(p => p.id === id);
    const shouldRefundSpots = target && target.status !== 'cancelada' && target.status !== 'lista_de_espera';

    if (useMockData) {
      setDemoParticipants(prev => prev.filter(p => p.id !== id));
      if (shouldRefundSpots && activityId) {
        setDemoActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots - 1) } : a));
      }
      return;
    }

    // Optimistic update
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (shouldRefundSpots && activityId) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots - 1) } : a));
    }

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await deleteParticipantFirestore(id);
        if (shouldRefundSpots && activityId) {
          await adjustActivitySpotsFirestore(activityId, -1);
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

  // Member Management Functions (Prompt 4)
  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt'> & { id?: string }) => {
    const nowIso = new Date().toISOString();
    const id = memberData.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMember: Member = {
      ...memberData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    if (useMockData) {
      setDemoMembers(prev => [...prev, newMember]);
      return { success: true, message: 'Socio registrado en modo demo.' };
    }

    setMembers(prev => [...prev, newMember]);

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await saveMemberFirestore(newMember);
      }
      return { success: true, message: 'Socio registrado correctamente.' };
    } catch (err: any) {
      console.error('Error saving member to Firestore:', err);
      return { success: true, message: 'Socio guardado localmente.' };
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const nowIso = new Date().toISOString();
    if (useMockData) {
      setDemoMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: nowIso } : m));
      return;
    }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: nowIso } : m));

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await updateMemberFirestore(id, updates);
      }
    } catch (err) {
      console.error('Error updating member in Firestore:', err);
    }
  };

  const deleteMember = async (id: string) => {
    if (useMockData) {
      setDemoMembers(prev => prev.filter(m => m.id !== id));
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));

    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await deleteMemberFirestore(id);
      }
    } catch (err) {
      console.error('Error deleting member from Firestore:', err);
    }
  };

  const importMembers = async (newMembersList: Omit<Member, 'id' | 'createdAt'>[]) => {
    let imported = 0;
    let skipped = 0;
    const nowIso = new Date().toISOString();
    const existingEmails = new Set(displayMembers.map(m => (m.email || '').toLowerCase().trim()).filter(Boolean));
    const existingNames = new Set(displayMembers.map(m => normalizeText(m.fullName)));

    const toAdd: Member[] = [];

    for (const item of newMembersList) {
      const normName = normalizeText(item.fullName);
      const emailLower = (item.email || '').toLowerCase().trim();

      if (!normName) {
        skipped++;
        continue;
      }

      if ((emailLower && existingEmails.has(emailLower)) || existingNames.has(normName)) {
        skipped++;
        continue;
      }

      const id = `mem-${Date.now()}-${imported}-${Math.random().toString(36).substring(2, 6)}`;
      const memberObj: Member = {
        ...item,
        id,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      toAdd.push(memberObj);
      if (emailLower) existingEmails.add(emailLower);
      existingNames.add(normName);
      imported++;
    }

    if (toAdd.length > 0) {
      if (useMockData) {
        setDemoMembers(prev => [...toAdd, ...prev]);
        return { imported, skipped };
      }
      setMembers(prev => [...toAdd, ...prev]);
      if (!useMockData && isFirebaseConfigured() && db) {
        for (const m of toAdd) {
          try {
            await saveMemberFirestore(m);
          } catch (e) {
            console.warn('Error saving imported member:', e);
          }
        }
      }
    }

    return { imported, skipped };
  };

  // Notification actions
  const markNotificationAsRead = async (id: string) => {
    if (useMockData) {
      setDemoNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await markAdminNotificationReadFirestore(id);
      }
    } catch (err) {
      console.warn('Error marking notification as read in Firestore:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (useMockData) {
      setDemoNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
    setAdminNotifications(prev => prev.filter(n => n.id !== id));
    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await deleteAdminNotificationFirestore(id);
      }
    } catch (err) {
      console.warn('Error deleting notification from Firestore:', err);
    }
  };

  const createNotification = async (notifData: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: AdminNotification = {
      ...notifData,
      id,
      read: false,
      createdAt: new Date().toISOString()
    };
    setAdminNotifications(prev => [newNotif, ...prev]);
    try {
      if (!useMockData && isFirebaseConfigured() && db) {
        await saveAdminNotificationFirestore(newNotif);
      }
    } catch (err) {
      console.warn('Error saving notification to Firestore:', err);
    }
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

  // Expenses
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      createdAt: nowIso
    };

    if (useMockData) {
      setDemoExpenses(prev => [...prev, newExpense]);
      return { success: true, message: 'Gasto registrado en modo demo.' };
    }

    setExpenses(prev => [...prev, newExpense]);
    try {
      if (isFirebaseConfigured() && db) {
        await saveExpenseFirestore(newExpense);
      }
      return { success: true, message: 'Gasto registrado con éxito.' };
    } catch (error: any) {
      console.error('Error saving expense:', error);
      // rollback
      setExpenses(prev => prev.filter(e => e.id !== newId));
      return { success: false, message: error.message || 'Error al guardar el gasto.' };
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (useMockData) {
      setDemoExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      return;
    }

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      if (isFirebaseConfigured() && db) {
        await updateExpenseFirestore(id, updates);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (useMockData) {
      setDemoExpenses(prev => prev.filter(e => e.id !== id));
      return;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteExpenseFirestore(id);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Sponsorships
  const addSponsorship = async (sponsorshipData: Omit<Sponsorship, 'id' | 'createdAt'>) => {
    const newId = `spon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    
    const newSponsorship: Sponsorship = {
      ...sponsorshipData,
      id: newId,
      createdAt: nowIso
    };

    if (useMockData) {
      setDemoSponsorships(prev => [...prev, newSponsorship]);
      return { success: true, message: 'Patrocinio registrado en modo demo.' };
    }

    setSponsorships(prev => [...prev, newSponsorship]);
    try {
      if (isFirebaseConfigured() && db) {
        await saveSponsorshipFirestore(newSponsorship);
      }
      return { success: true, message: 'Patrocinio registrado con éxito.' };
    } catch (error: any) {
      console.error('Error saving sponsorship:', error);
      // rollback
      setSponsorships(prev => prev.filter(s => s.id !== newId));
      return { success: false, message: error.message || 'Error al guardar el patrocinio.' };
    }
  };

  const updateSponsorship = async (id: string, updates: Partial<Sponsorship>) => {
    if (useMockData) {
      setDemoSponsorships(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      return;
    }

    setSponsorships(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      if (isFirebaseConfigured() && db) {
        await updateSponsorshipFirestore(id, updates);
      }
    } catch (error) {
      console.error('Error updating sponsorship:', error);
    }
  };

  const deleteSponsorship = async (id: string) => {
    if (useMockData) {
      setDemoSponsorships(prev => prev.filter(s => s.id !== id));
      return;
    }

    setSponsorships(prev => prev.filter(s => s.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteSponsorshipFirestore(id);
      }
    } catch (error) {
      console.error('Error deleting sponsorship:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      activities: displayActivities,
      catas,
      cursos,
      viajes,
      participants: displayParticipants,
      members: displayMembers,
      adminNotifications: displayNotifications,
      expenses: displayExpenses,
      sponsorships: displaySponsorships,
      unreadNotificationsCount,
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
      addMember,
      updateMember,
      deleteMember,
      importMembers,
      markNotificationAsRead,
      deleteNotification,
      createNotification,
      // expenses
      addExpense,
      updateExpense,
      deleteExpense,
      // sponsorships
      addSponsorship,
      updateSponsorship,
      deleteSponsorship,
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
