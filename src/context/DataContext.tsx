import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, AdminNotification, CataActivity, CursoActivity, Member, Participant, ParticipantStatus, ReservationFailureKind, ReservationFormData, ReservationResult, ViajeActivity, WebMetric, Expense, Sponsorship, ContactMessage, AdvancedAttendanceCorrectionParams, AdvancedCorrectionResult, GeneralIncome, GeneralExpense, GeneralIncomeStatus, AnnualMembershipFeesRecord, MemberFeeItem } from '../types';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../services/firebase';
import { INITIAL_PARTICIPANTS } from '../data/mockData';
import { DEMO_ACTIVITIES, DEMO_PARTICIPANTS, DEMO_MEMBERS, DEMO_NOTIFICATIONS, DEMO_METRICS, DEMO_EXPENSES, DEMO_SPONSORSHIPS, DEMO_CONTACT_MESSAGES, DEMO_GENERAL_INCOMES, DEMO_GENERAL_EXPENSES, DEMO_ANNUAL_FEES } from '../data/demoData';
import {
  subscribeToActivitiesFirestore,
  subscribeToMetricsFirestore,
  subscribeToParticipantsFirestore,
  saveActivityFirestore,
  updateActivityFirestore,
  deleteActivityFirestore,
  updateParticipantFirestore,
  deleteParticipantFirestore,
  addManualParticipantFirestore,
  executeParticipantTransitionFirestore,
  executeAdvancedAttendanceCorrectionFirestore,
  closeActivityAsCelebratedFirestore,
  executeAdministrativeMigrationFirestore,
  subscribeToMembersFirestore,
  saveMemberFirestore,
  updateMemberFirestore,
  deleteMemberFirestore,
  subscribeToAdminNotificationsFirestore,
  saveExpenseFirestore,
  updateExpenseFirestore,
  deleteExpenseFirestore,
  subscribeToExpensesFirestore,
  subscribeToSponsorshipsFirestore,
  saveSponsorshipFirestore,
  updateSponsorshipFirestore,
  deleteSponsorshipFirestore,
  subscribeToGeneralIncomesFirestore,
  saveGeneralIncomeFirestore,
  updateGeneralIncomeFirestore,
  deleteGeneralIncomeFirestore,
  subscribeToGeneralExpensesFirestore,
  saveGeneralExpenseFirestore,
  updateGeneralExpenseFirestore,
  deleteGeneralExpenseFirestore,
  subscribeToAnnualMembershipFeesFirestore,
  saveAnnualMembershipFeesFirestore,
  saveAdminNotificationFirestore,
  markAdminNotificationReadFirestore,
  deleteAdminNotificationFirestore,
  subscribeToContactMessagesFirestore,
  saveContactMessageFirestore,
  updateContactMessageFirestore,
  markContactAlertSeenFirestore,
  deleteContactMessageFirestore,
  validateTwoShiftCataPair,
  saveTwoShiftCataFirestore
} from '../services/firestoreService';
import { validateAndPrepareTransition, isActivityConcluded, checkAttendanceSheetComplete, validateAndPrepareAdvancedCorrection } from '../services/participantTransitions';
import { normalizeParticipantRecord } from '../services/participantMigration';
import { validateIdempotencyKey, classifyReservationFailure } from '../services/reservationTransaction';

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
  contactMessages: ContactMessage[];
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  metrics: WebMetric;
  isConnected: boolean;
  connectionError: string | null;
  getActivityById: (id: string) => Activity | undefined;
  getParticipantsByActivityId: (activityId: string) => Participant[];
  addActivity: (activity: Activity) => Promise<void>;
  addTwoShiftCata: (shift1: CataActivity, shift2: CataActivity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  quickUpdateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  reserveSpots: (id: string, spots: number, reservationData: ReservationFormData) => Promise<ReservationResult>;
  addManualParticipant: (participantData: Omit<Participant, 'id' | 'registeredAt'> & { id?: string }) => Promise<{ success: boolean; message: string }>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string, activityId: string, _legacySpots?: number) => Promise<void>;
  markAttendance: (id: string, attended: boolean) => Promise<void>;
  executeParticipantTransition: (params: {
    participantId: string;
    activityId: string;
    targetStatus: ParticipantStatus;
    actor?: string;
    cancellationData?: {
      reason: string;
      justified: boolean;
      kind: 'cancelacion_usuario' | 'no_presentado';
      refundAmount?: number;
    };
  }) => Promise<{ success: boolean; error?: string; updatedParticipant?: Partial<Participant> }>;
  executeAdvancedAttendanceCorrection: (
    params: AdvancedAttendanceCorrectionParams
  ) => Promise<AdvancedCorrectionResult>;
  closeActivityAsCelebrated: (activityId: string, actor?: string) => Promise<{
    success: boolean;
    alreadyClosed?: boolean;
    blockedByPendingSheet?: boolean;
    pendingCount?: number;
    pendingParticipantIds?: string[];
    error?: string;
    message?: string;
  }>;
  executeAdministrativeMigration: (actor?: string) => Promise<{
    success: boolean;
    migratedCount: number;
    results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string; error?: string }>;
    error?: string;
  }>;
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
  // General Incomes (Asociación)
  generalIncomes: GeneralIncome[];
  addGeneralIncome: (incomeData: Omit<GeneralIncome, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateGeneralIncome: (id: string, updates: Partial<GeneralIncome>) => Promise<void>;
  deleteGeneralIncome: (id: string) => Promise<void>;
  // General Expenses (Asociación)
  generalExpenses: GeneralExpense[];
  addGeneralExpense: (expenseData: Omit<GeneralExpense, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateGeneralExpense: (id: string, updates: Partial<GeneralExpense>) => Promise<void>;
  deleteGeneralExpense: (id: string) => Promise<void>;
  // Annual Membership Fees (Estado de Cuotas)
  annualMembershipFees: AnnualMembershipFeesRecord[];
  saveAnnualMembershipFees: (record: AnnualMembershipFeesRecord) => Promise<{ success: boolean; message: string }>;
  // Contact Messages
  sendContactMessage: (msgData: Omit<ContactMessage, 'id' | 'createdAt' | 'read' | 'status'>) => Promise<{ success: boolean; message: string; messageSaved?: boolean; emailSent?: boolean; messageId?: string }>;
  markContactMessageRead: (id: string, read?: boolean) => Promise<void>;
  markContactAlertSeen: (id: string, seenBy?: string, seenByUid?: string) => Promise<void>;
  updateContactMessageStatus: (id: string, status: 'nuevo' | 'leido' | 'respondido', replyNotes?: string) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
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

const mockIdempotencyStore = new Map<string, {
  success: boolean;
  message: string;
  groupId: string;
  status: ParticipantStatus;
  participants: Participant[];
  bookedSpots: number;
}>();

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [generalIncomes, setGeneralIncomes] = useState<GeneralIncome[]>([]);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
  const [annualMembershipFees, setAnnualMembershipFees] = useState<AnnualMembershipFeesRecord[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
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
  const [demoGeneralIncomes, setDemoGeneralIncomes] = useState<GeneralIncome[]>(DEMO_GENERAL_INCOMES);
  const [demoGeneralExpenses, setDemoGeneralExpenses] = useState<GeneralExpense[]>(DEMO_GENERAL_EXPENSES);
  const [demoAnnualMembershipFees, setDemoAnnualMembershipFees] = useState<AnnualMembershipFeesRecord[]>(DEMO_ANNUAL_FEES);
  const [demoContactMessages, setDemoContactMessages] = useState<ContactMessage[]>(DEMO_CONTACT_MESSAGES);
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
  const displayGeneralIncomes = useMockData ? demoGeneralIncomes : generalIncomes;
  const displayGeneralExpenses = useMockData ? demoGeneralExpenses : generalExpenses;
  const displayAnnualMembershipFees = useMockData ? demoAnnualMembershipFees : annualMembershipFees;
  const displayContactMessages = useMockData ? demoContactMessages : contactMessages;
  const displayMetrics = useMockData ? demoMetrics : metrics;

  const unreadNotificationsCount = displayNotifications.filter(n => !n.read).length;
  const unreadMessagesCount = displayContactMessages.filter(m => !m.read || m.status === 'nuevo').length;

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
        setGeneralIncomes([]);
        setGeneralExpenses([]);
      }
      return;
    }

    let unsubParticipants: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;
    let unsubExpenses: (() => void) | null = null;
    let unsubSponsorships: (() => void) | null = null;
    let unsubGeneralIncomes: (() => void) | null = null;
    let unsubGeneralExpenses: (() => void) | null = null;
    let unsubAnnualFees: (() => void) | null = null;
    let unsubContactMessages: (() => void) | null = null;

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

    try {
      unsubGeneralIncomes = subscribeToGeneralIncomesFirestore(
        (firestoreGeneralIncomes) => {
          if (firestoreGeneralIncomes) {
            setGeneralIncomes(firestoreGeneralIncomes);
          }
        },
        (err) => {
          console.warn('General Incomes subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize general incomes subscription:', err);
    }

    try {
      unsubGeneralExpenses = subscribeToGeneralExpensesFirestore(
        (firestoreGeneralExpenses) => {
          if (firestoreGeneralExpenses) {
            setGeneralExpenses(firestoreGeneralExpenses);
          }
        },
        (err) => {
          console.warn('General Expenses subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize general expenses subscription:', err);
    }

    try {
      unsubAnnualFees = subscribeToAnnualMembershipFeesFirestore(
        (firestoreFees) => {
          if (firestoreFees) {
            setAnnualMembershipFees(firestoreFees);
          }
        },
        (err) => {
          console.warn('Annual membership fees subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize annual fees subscription:', err);
    }

    try {
      unsubContactMessages = subscribeToContactMessagesFirestore(
        (firestoreMessages) => {
          if (firestoreMessages) {
            setContactMessages(firestoreMessages);
          }
        },
        (err) => {
          console.warn('Contact messages subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('Could not initialize contact messages subscription:', err);
    }

    return () => {
      if (unsubParticipants) unsubParticipants();
      if (unsubMembers) unsubMembers();
      if (unsubNotifications) unsubNotifications();
      if (unsubExpenses) unsubExpenses();
      if (unsubSponsorships) unsubSponsorships();
      if (unsubGeneralIncomes) unsubGeneralIncomes();
      if (unsubGeneralExpenses) unsubGeneralExpenses();
      if (unsubAnnualFees) unsubAnnualFees();
      if (unsubContactMessages) unsubContactMessages();
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
      setDemoActivities(prev => [activity, ...prev]);
      return;
    }
    if (isFirebaseConfigured() && db) {
      await saveActivityFirestore(activity);
    }
    setActivities(prev => [activity, ...prev.filter(a => a.id !== activity.id)]);
  };

  const addTwoShiftCata = async (shift1: CataActivity, shift2: CataActivity): Promise<void> => {
    const validation = validateTwoShiftCataPair(shift1, shift2);
    if (!validation.valid) {
      throw new Error(validation.error || 'Error de validación en la pareja de turnos.');
    }

    if (useMockData) {
      setDemoActivities(prev => [shift1, shift2, ...prev]);
      return;
    }

    if (isFirebaseConfigured() && db) {
      await saveTwoShiftCataFirestore(shift1, shift2);
    }
    setActivities(prev => [shift1, shift2, ...prev.filter(a => a.id !== shift1.id && a.id !== shift2.id)]);
  };

  const updateActivity = async (updated: Activity) => {
    const list = useMockData ? demoActivities : activities;
    const current = list.find(a => a.id === updated.id);
    if (current && current.status === 'celebrada' && updated.status !== 'celebrada') {
      throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
    }
    if (current && current.status !== 'celebrada' && updated.status === 'celebrada') {
      throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
    }

    if (useMockData) {
      setDemoActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
      return;
    }
    if (isFirebaseConfigured() && db) {
      await saveActivityFirestore(updated);
    }
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const quickUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    const list = useMockData ? demoActivities : activities;
    const current = list.find(a => a.id === id);
    if (current && current.status === 'celebrada' && updates.status && updates.status !== 'celebrada') {
      throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
    }
    if (current && current.status !== 'celebrada' && updates.status === 'celebrada') {
      throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
    }

    if (useMockData) {
      setDemoActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      return;
    }
    // Optimistic local state update so the UI reacts immediately
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    try {
      if (isFirebaseConfigured() && db) {
        await updateActivityFirestore(id, updates);
      }
    } catch (err) {
      console.error('Error updating activity in Firestore:', err);
    }
  };

  const deleteActivity = async (id: string) => {
    if (useMockData) {
      setDemoActivities(prev => prev.filter(a => a.id !== id));
      return;
    }
    // Optimistic local state removal so UI updates immediately
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteActivityFirestore(id);
      }
    } catch (err) {
      console.error('Error deleting activity from Firestore:', err);
    }
  };

  const reserveSpots = async (id: string, requestedSpots: number, reservationData: ReservationFormData): Promise<ReservationResult> => {
    // RES-01 & AC-04: Validate idempotency key strictly. Never invent a fallback key for callers that omit it.
    const keyValidation = validateIdempotencyKey(reservationData.idempotencyKey);
    if (!keyValidation.valid) {
      return {
        success: false,
        message: keyValidation.error || 'Se requiere una clave de idempotencia válida para procesar la reserva.',
        failureKind: 'definitive',
        httpStatus: 400
      };
    }
    const idempotencyKey = keyValidation.key;

    const activity = displayActivities.find(a => a.id === id);
    if (!activity) {
      return {
        success: false,
        message: 'La actividad solicitada no existe o no está disponible.',
        failureKind: 'definitive',
        httpStatus: 404
      };
    }

    if (activity.status === 'celebrada') {
      return {
        success: false,
        message: 'Esta actividad ya ha sido celebrada y no admite nuevas reservas.',
        failureKind: 'definitive',
        httpStatus: 400
      };
    }

    if (activity.registrationStatus === 'cerrada') {
      return {
        success: false,
        message: 'Las inscripciones para esta actividad se encuentran actualmente cerradas.',
        failureKind: 'definitive',
        httpStatus: 400
      };
    }

    // Never reject in browser because local aforo looks full. Dispatch to server / atomic handler.
    // Try calling server-side atomic endpoint if not in pure mock mode
    if (!useMockData && isFirebaseConfigured()) {
      try {
        const response = await fetch('/api/reserve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({
            activityId: id,
            spots: requestedSpots,
            idempotencyKey,
            reservationData: {
              ...reservationData,
              idempotencyKey
            }
          })
        });

        let result: any = null;
        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (!response.ok || !result?.success) {
          const failureKind = classifyReservationFailure(response.status);
          return {
            success: false,
            message: result?.error || 'No se pudo completar la reserva. Por favor, inténtalo de nuevo.',
            failureKind,
            httpStatus: response.status
          };
        }

        // Build local memory state strictly from server response with deduplication
        const serverGroupId = result.groupId || `grp-${Date.now()}`;
        const returnedStatus: ParticipantStatus = result.status === 'lista_de_espera' ? 'lista_de_espera' : 'pendiente_pago';
        const nowIso = new Date().toISOString();
        const priceMember = activity.priceMember;
        const priceNonMember = activity.priceNonMember;
        const turnText = reservationData.turn || (activity.time ? `Turno (${activity.time})` : undefined);

        let newParticipants: Participant[] = [];
        if (Array.isArray(result.participants) && result.participants.length > 0) {
          newParticipants = result.participants;
        } else {
          const isTitularMember = reservationData.isMember ?? (reservationData.attendees?.[0]?.isMember ?? false);
          const titularPrice = isTitularMember ? priceMember : priceNonMember;

          newParticipants.push({
            id: `part-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`,
            activityId: activity.id,
            activityTitle: activity.title,
            activityDate: activity.date,
            activityType: activity.type,
            fullName: reservationData.fullName.trim(),
            email: reservationData.email.trim(),
            phone: reservationData.phone.trim(),
            isMember: isTitularMember,
            groupId: serverGroupId,
            turn: turnText,
            membershipNumber: reservationData.membershipNumber?.trim() || undefined,
            notes: reservationData.notes?.trim() || undefined,
            status: returnedStatus,
            totalAmount: titularPrice,
            paidAmount: 0,
            paymentMethod: reservationData.paymentMethod || 'bizum',
            registeredAt: nowIso,
            updatedAt: nowIso
          });

          for (let i = 1; i < requestedSpots; i++) {
            const compData = reservationData.attendees?.[i];
            const isCompMember = !!compData?.isMember;
            const compPrice = isCompMember ? priceMember : priceNonMember;

            newParticipants.push({
              id: `part-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              activityId: activity.id,
              activityTitle: activity.title,
              activityDate: activity.date,
              activityType: activity.type,
              fullName: compData?.fullName?.trim() || `Acompañante ${i} (${reservationData.fullName.trim()})`,
              email: compData?.email?.trim() || '',
              phone: compData?.phone?.trim() || '',
              isMember: isCompMember,
              groupId: serverGroupId,
              turn: turnText,
              membershipNumber: compData?.membershipNumber?.trim() || undefined,
              notes: compData?.notes?.trim() || undefined,
              status: returnedStatus,
              totalAmount: compPrice,
              paidAmount: 0,
              paymentMethod: reservationData.paymentMethod || 'bizum',
              registeredAt: nowIso,
              updatedAt: nowIso
            });
          }
        }

        // Deduplicate in case of server replay
        setParticipants(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const toAdd = newParticipants.filter(p => !existingIds.has(p.id));
          if (toAdd.length === 0) return prev;
          return [...toAdd, ...prev];
        });

        if (typeof result.bookedSpots === 'number') {
          setActivities(prev => prev.map(a => a.id === id ? { ...a, bookedSpots: result.bookedSpots } : a));
        } else if (returnedStatus === 'pendiente_pago') {
          setActivities(prev => prev.map(a => a.id === id ? { ...a, bookedSpots: a.bookedSpots + requestedSpots } : a));
        }

        const message = returnedStatus === 'lista_de_espera'
          ? `Solicitud de ${requestedSpots} plaza(s) registrada en lista de espera para ${reservationData.fullName}.`
          : `Reserva de ${requestedSpots} plaza(s) registrada correctamente para ${reservationData.fullName}.`;

        return {
          success: true,
          message,
          groupId: serverGroupId,
          status: returnedStatus,
          participants: newParticipants,
          bookedSpots: typeof result.bookedSpots === 'number' ? result.bookedSpots : undefined
        };
      } catch (networkErr: any) {
        console.error('Error invoking /api/reserve:', networkErr);
        return {
          success: false,
          message: 'Error de conexión al tramitar la reserva. Puedes reintentar la operación.',
          failureKind: 'retryable'
        };
      }
    }

    // Local / Mock Mode Atomic Reservation Flow
    if (mockIdempotencyStore.has(idempotencyKey)) {
      const cached = mockIdempotencyStore.get(idempotencyKey)!;
      return {
        success: cached.success,
        message: cached.message,
        groupId: cached.groupId,
        status: cached.status,
        participants: cached.participants,
        bookedSpots: cached.bookedSpots
      };
    }

    const groupId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `grp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const nowIso = new Date().toISOString();
    const priceMember = activity.priceMember;
    const priceNonMember = activity.priceNonMember;
    const turnText = reservationData.turn || (activity.time ? `Turno (${activity.time})` : undefined);

    const availableSpots = Math.max(0, activity.totalSpots - activity.bookedSpots);
    const hasEnoughCapacity = availableSpots >= requestedSpots;
    const assignedStatus: ParticipantStatus = hasEnoughCapacity ? 'pendiente_pago' : 'lista_de_espera';
    const resultingBookedSpots = hasEnoughCapacity ? activity.bookedSpots + requestedSpots : activity.bookedSpots;

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
      status: assignedStatus,
      totalAmount: titularPrice,
      paidAmount: 0,
      paymentMethod: reservationData.paymentMethod || 'bizum',
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
        status: assignedStatus,
        totalAmount: compPrice,
        paidAmount: 0,
        paymentMethod: reservationData.paymentMethod || 'bizum',
        registeredAt: nowIso,
        updatedAt: nowIso
      });
    }

    // Local state commit
    setParticipants(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = newParticipants.filter(p => !existingIds.has(p.id));
      if (toAdd.length === 0) return prev;
      return [...toAdd, ...prev];
    });

    if (hasEnoughCapacity) {
      setActivities(prev => prev.map(a => a.id === id ? { ...a, bookedSpots: resultingBookedSpots } : a));
    }

    const mockMessage = assignedStatus === 'lista_de_espera'
      ? `Solicitud de ${requestedSpots} plaza(s) registrada en lista de espera para ${reservationData.fullName}.`
      : `Reserva de ${requestedSpots} plaza(s) registrada correctamente para ${reservationData.fullName}.`;

    mockIdempotencyStore.set(idempotencyKey, {
      success: true,
      message: mockMessage,
      groupId,
      status: assignedStatus,
      participants: newParticipants,
      bookedSpots: resultingBookedSpots
    });

    // Contrast check against members census
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
            severity: 'attention',
            title: 'Discrepancia de Socio (Reserva)',
            dedupeKey: `socio_mismatch_${p.activityId}_${p.id}`,
            message: `Aviso de reserva: "${p.fullName}" se indicó como SOCIO para "${p.activityTitle}", pero no figura en el censo activo de socios.`,
            activityId: p.activityId,
            participantId: p.id,
            read: false,
            createdAt: nowIso
          };
          setAdminNotifications(prev => [notif, ...prev]);
        }
      } else {
        if (matchedMember && matchedMember.active) {
          const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const notif: AdminNotification = {
            id: notifId,
            type: 'socio_mismatch',
            severity: 'info',
            title: 'Socio registrado como No Socio',
            dedupeKey: `socio_mismatch_active_${p.activityId}_${p.id}`,
            message: `Aviso de reserva: "${p.fullName}" se registró como NO SOCIO para "${p.activityTitle}", pero figura como socio activo (${matchedMember.membershipNumber || 'S/N'}). Se le podría haber cobrado tarifa general.`,
            activityId: p.activityId,
            participantId: p.id,
            read: false,
            createdAt: nowIso
          };
          setAdminNotifications(prev => [notif, ...prev]);
        }
      }
    }

    return { 
      success: true, 
      message: mockMessage,
      groupId,
      status: assignedStatus,
      participants: newParticipants,
      bookedSpots: resultingBookedSpots
    };
  };

  const addManualParticipant = async (participantData: Omit<Participant, 'id' | 'status' | 'registeredAt'> & { id?: string }) => {
    const activity = displayActivities.find(a => a.id === participantData.activityId);
    if (!activity) {
      return { success: false, message: 'Actividad no encontrada.' };
    }
    if (activity.status === 'celebrada') {
      return { success: false, message: 'No se pueden añadir participantes a una actividad ya celebrada.' };
    }

    const nowIso = new Date().toISOString();
    const newId = participantData.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const groupId = participantData.groupId || `grp-manual-${Date.now()}`;
    const hasSpot = activity.bookedSpots < activity.totalSpots;
    const assignedStatus: ParticipantStatus = hasSpot ? 'pendiente_pago' : 'lista_de_espera';

    const newParticipant: Participant = {
      ...participantData,
      id: newId,
      groupId,
      isMember: !!participantData.isMember,
      status: assignedStatus,
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    if (useMockData || !isFirebaseConfigured() || !db) {
      setDemoParticipants(prev => [newParticipant, ...prev]);
      if (hasSpot) {
        setDemoActivities(prev => prev.map(a => a.id === participantData.activityId ? { ...a, bookedSpots: a.bookedSpots + 1 } : a));
      }
      return {
        success: true,
        message: hasSpot
          ? 'Asistente añadido con plaza (pendiente de pago).'
          : 'Aforo completo: asistente añadido a lista de espera.'
      };
    }

    try {
      const created = await addManualParticipantFirestore(participantData);
      setParticipants(prev => [created, ...prev]);
      if (created.status === 'pendiente_pago') {
        setActivities(prev => prev.map(a => a.id === participantData.activityId ? { ...a, bookedSpots: a.bookedSpots + 1 } : a));
      }
      return {
        success: true,
        message: created.status === 'pendiente_pago'
          ? 'Asistente añadido con plaza (pendiente de pago).'
          : 'Aforo completo: asistente añadido a lista de espera.'
      };
    } catch (err: any) {
      console.error('Error in addManualParticipant:', err);
      return { success: false, message: err?.message || 'Error al añadir asistente.' };
    }
  };

  const updateParticipant = async (id: string, updates: Partial<Participant>) => {
    const list = useMockData ? demoParticipants : participants;
    const old = list.find(p => p.id === id);
    if (!old) return;

    // Security rule: updateParticipant CANNOT modify status or spotsCount.
    // Transitions that affect status or aforo must be executed via executeParticipantTransition.
    const {
      status: _s,
      spotsCount: _sc,
      ...safeUpdates
    } = updates as any;

    const updatedObj = { ...old, ...safeUpdates, updatedAt: new Date().toISOString() };

    if (useMockData) {
      setDemoParticipants(prev => prev.map(p => p.id === id ? updatedObj : p));
      return;
    }

    setParticipants(prev => prev.map(p => p.id === id ? updatedObj : p));

    try {
      if (isFirebaseConfigured() && db) {
        await updateParticipantFirestore(id, safeUpdates);
      }
    } catch (err) {
      console.error('Error updating participant in Firestore:', err);
      // Rollback
      setParticipants(prev => prev.map(p => p.id === id ? old : p));
    }
  };

  const deleteParticipant = async (id: string) => {
    const list = useMockData ? demoParticipants : participants;
    const target = list.find(p => p.id === id);
    if (!target) return;

    if (useMockData) {
      setDemoParticipants(prev => prev.filter(p => p.id !== id));
      return;
    }

    setParticipants(prev => prev.filter(p => p.id !== id));

    try {
      if (isFirebaseConfigured() && db) {
        await deleteParticipantFirestore(id);
      }
    } catch (err) {
      console.error('Error deleting participant from Firestore:', err);
      setParticipants(prev => [...prev, target]);
    }
  };

  const markAttendance = async (id: string, attended: boolean) => {
    const list = useMockData ? demoParticipants : participants;
    const target = list.find(p => p.id === id);
    if (!target) return;
    const targetActivity = (useMockData ? demoActivities : activities).find(a => a.id === target.activityId);

    if (attended) {
      await executeParticipantTransition({
        participantId: id,
        activityId: target.activityId,
        targetStatus: 'asistio'
      });
    } else {
      await executeParticipantTransition({
        participantId: id,
        activityId: target.activityId,
        targetStatus: 'cancelada',
        cancellationData: {
          reason: 'No presentado',
          justified: false,
          kind: 'no_presentado'
        }
      });
    }
  };

  const executeParticipantTransition = async ({
    participantId,
    activityId,
    targetStatus,
    actor = 'Administración',
    cancellationData
  }: {
    participantId: string;
    activityId: string;
    targetStatus: ParticipantStatus;
    actor?: string;
    cancellationData?: {
      reason: string;
      justified: boolean;
      kind: 'cancelacion_usuario' | 'no_presentado';
      refundAmount?: number;
    };
  }): Promise<{ success: boolean; error?: string; updatedParticipant?: Partial<Participant> }> => {
    const currentParticipants = useMockData ? demoParticipants : participants;
    const currentActivities = useMockData ? demoActivities : activities;

    const participant = currentParticipants.find(p => p.id === participantId);
    const activity = currentActivities.find(a => a.id === activityId);

    if (!participant) {
      return { success: false, error: 'Participante no encontrado.' };
    }

    const transition = validateAndPrepareTransition({
      participant,
      targetStatus,
      activity,
      actor,
      cancellationData
    });

    if (!transition.allowed) {
      return { success: false, error: transition.error };
    }

    const updates = transition.updatedParticipant || {};
    const spotsDelta = transition.spotsDelta || 0;

    if (useMockData) {
      setDemoParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
      if (spotsDelta !== 0 && activityId) {
        setDemoActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots + spotsDelta) } : a));
      }
      return { success: true, updatedParticipant: updates };
    }

    if (isFirebaseConfigured() && db) {
      try {
        const res = await executeParticipantTransitionFirestore({
          participantId,
          activityId,
          targetStatus,
          actor,
          cancellationData
        });
        if (res.success) {
          setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
          if (spotsDelta !== 0 && activityId) {
            setActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots + spotsDelta) } : a));
          }
        }
        return res;
      } catch (err: any) {
        console.error('Error executing Firestore transition transaction:', err);
        return { success: false, error: err.message || 'Error al persistir la transición en la base de datos.' };
      }
    }

    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
    if (spotsDelta !== 0 && activityId) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, bookedSpots: Math.max(0, a.bookedSpots + spotsDelta) } : a));
    }
    return { success: true, updatedParticipant: updates };
  };

  const executeAdvancedAttendanceCorrection = async (
    params: AdvancedAttendanceCorrectionParams
  ): Promise<AdvancedCorrectionResult> => {
    const currentParticipants = useMockData ? demoParticipants : participants;
    const currentActivities = useMockData ? demoActivities : activities;

    const participant = currentParticipants.find(p => p.id === params.participantId);
    const activity = currentActivities.find(a => a.id === params.activityId);

    if (!participant) {
      return { success: false, error: 'Participante no encontrado.' };
    }
    if (!activity) {
      return { success: false, error: 'Actividad no encontrada.' };
    }

    const validation = validateAndPrepareAdvancedCorrection({
      participant,
      activity,
      targetStatus: params.targetStatus,
      correctionReason: params.correctionReason,
      actor: params.actor,
      cancellationData: params.cancellationData,
      paymentData: params.paymentData,
      attendanceData: params.attendanceData
    });

    if (!validation.allowed) {
      return { success: false, error: validation.error };
    }

    const partUpdates = validation.updatedParticipant || {};
    const actUpdates = validation.activityUpdates || {};

    if (useMockData) {
      setDemoParticipants(prev => prev.map(p => p.id === params.participantId ? { ...p, ...partUpdates } : p));
      setDemoActivities(prev => prev.map(a => a.id === params.activityId ? { ...a, ...actUpdates } : a));
      return {
        success: true,
        updatedParticipant: partUpdates,
        updatedActivity: actUpdates,
        spotsDelta: validation.spotsDelta,
        willReopen: validation.willReopen
      };
    }

    if (isFirebaseConfigured() && db) {
      try {
        const res = await executeAdvancedAttendanceCorrectionFirestore(params);
        if (res.success) {
          setParticipants(prev => prev.map(p => p.id === params.participantId ? { ...p, ...partUpdates } : p));
          setActivities(prev => prev.map(a => a.id === params.activityId ? { ...a, ...actUpdates } : a));
        }
        return res;
      } catch (err: any) {
        console.error('Error executing Firestore advanced correction transaction:', err);
        return { success: false, error: err.message || 'Error al persistir la corrección en la base de datos.' };
      }
    }

    setParticipants(prev => prev.map(p => p.id === params.participantId ? { ...p, ...partUpdates } : p));
    setActivities(prev => prev.map(a => a.id === params.activityId ? { ...a, ...actUpdates } : a));
    return {
      success: true,
      updatedParticipant: partUpdates,
      updatedActivity: actUpdates,
      spotsDelta: validation.spotsDelta,
      willReopen: validation.willReopen
    };
  };

  const closeActivityAsCelebrated = async (
    activityId: string,
    actor: string = 'Administración'
  ): Promise<{
    success: boolean;
    alreadyClosed?: boolean;
    blockedByPendingSheet?: boolean;
    pendingCount?: number;
    pendingParticipantIds?: string[];
    error?: string;
    message?: string;
  }> => {
    const currentActivities = useMockData ? demoActivities : activities;
    const currentParticipants = useMockData ? demoParticipants : participants;
    const activity = currentActivities.find(a => a.id === activityId);

    if (!activity) {
      return { success: false, error: 'Actividad no encontrada.' };
    }

    if (activity.status === 'celebrada') {
      return {
        success: true,
        alreadyClosed: true,
        message: 'La actividad ya estaba cerrada como celebrada.'
      };
    }

    if (useMockData) {
      const sheetStatus = checkAttendanceSheetComplete(currentParticipants, activityId);
      if (!sheetStatus.isComplete) {
        return {
          success: false,
          blockedByPendingSheet: true,
          pendingCount: sheetStatus.pendingCount,
          pendingParticipantIds: sheetStatus.pendingParticipantIds,
          error: 'Para cerrar la actividad debes completar la hoja de asistencia.'
        };
      }
      setDemoActivities(prev => prev.map(a => a.id === activityId ? { ...a, status: 'celebrada', registrationStatus: 'cerrada' } : a));
      return { success: true, message: 'Actividad cerrada y marcada como celebrada correctamente.' };
    }

    if (isFirebaseConfigured() && db) {
      try {
        const res = await closeActivityAsCelebratedFirestore(activityId, actor);
        if (res.success && !res.alreadyClosed) {
          setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status: 'celebrada', registrationStatus: 'cerrada' } : a));
        }
        return res;
      } catch (err: any) {
        console.error('Error closing activity as celebrated in Firestore:', err);
        return { success: false, error: err.message || 'Error al cerrar la actividad en el servidor.' };
      }
    }

    // Local state fallback if no Firestore
    const sheetStatus = checkAttendanceSheetComplete(currentParticipants, activityId);
    if (!sheetStatus.isComplete) {
      return {
        success: false,
        blockedByPendingSheet: true,
        pendingCount: sheetStatus.pendingCount,
        pendingParticipantIds: sheetStatus.pendingParticipantIds,
        error: 'Para cerrar la actividad debes completar la hoja de asistencia.'
      };
    }
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status: 'celebrada', registrationStatus: 'cerrada' } : a));
    return { success: true, message: 'Actividad cerrada y marcada como celebrada correctamente.' };
  };

  const executeAdministrativeMigration = async (
    actor: string = 'Migración Administrativa'
  ): Promise<{
    success: boolean;
    migratedCount: number;
    results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string; error?: string }>;
    error?: string;
  }> => {
    const currentParticipants = useMockData ? demoParticipants : participants;

    if (useMockData) {
      const results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string }> = [];
      let migratedCount = 0;
      const updatedList = currentParticipants.map(p => {
        const rawStatus = (p.status as string) || '';
        const norm = normalizeParticipantRecord(p, actor);
        if (norm.needsMigration) {
          migratedCount++;
        }
        results.push({
          id: p.id,
          success: true,
          previousStatus: rawStatus,
          targetStatus: norm.targetStatus
        });
        return norm.cleanRecord;
      });

      setDemoParticipants(updatedList);
      return { success: true, migratedCount, results };
    }

    if (isFirebaseConfigured() && db) {
      try {
        const res = await executeAdministrativeMigrationFirestore(currentParticipants, actor);
        if (res.success || res.migratedCount > 0) {
          const successIds = new Set(res.results.filter(r => r.success).map(r => r.id));
          setParticipants(prev => prev.map(p => {
            if (successIds.has(p.id)) {
              return normalizeParticipantRecord(p, actor).cleanRecord;
            }
            return p;
          }));
        }
        return res;
      } catch (err: any) {
        console.error('Error in executeAdministrativeMigration:', err);
        return {
          success: false,
          migratedCount: 0,
          results: [],
          error: err.message || 'Error al ejecutar la normalización canónica en Firestore.'
        };
      }
    }

    // Fallback without active Firestore
    const results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string }> = [];
    let migratedCount = 0;
    const updatedList = currentParticipants.map(p => {
      const rawStatus = (p.status as string) || '';
      const norm = normalizeParticipantRecord(p, actor);
      if (norm.needsMigration) {
        migratedCount++;
      }
      results.push({
        id: p.id,
        success: true,
        previousStatus: rawStatus,
        targetStatus: norm.targetStatus
      });
      return norm.cleanRecord;
    });

    setParticipants(updatedList);
    return { success: true, migratedCount, results };
  };

  // Member Management Functions (Prompt 4 & Bloque 7)
  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt'> & { id?: string }) => {
    const memNum = (memberData.membershipNumber || '').trim();
    const currentMemberList = useMockData ? demoMembers : members;

    // Validate unique membership number when provided
    if (memNum) {
      const isDuplicate = currentMemberList.some(
        m => m.active && (m.membershipNumber || '').trim().toLowerCase() === memNum.toLowerCase()
      );
      if (isDuplicate) {
        throw new Error(`El número de socio «${memNum}» ya está asignado a otro socio activo en el Censo.`);
      }
    }

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

    if (!useMockData && isFirebaseConfigured() && db) {
      try {
        await saveMemberFirestore(newMember);
        setMembers(prev => [...prev, newMember]);
        return { success: true, message: 'Socio registrado correctamente en el Censo.' };
      } catch (err: any) {
        console.error('Error saving member to Firestore:', err);
        throw new Error(`Error al persistir el socio en la base de datos: ${err.message || err}`);
      }
    }

    setMembers(prev => [...prev, newMember]);
    return { success: true, message: 'Socio guardado localmente.' };
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

  // General Incomes (Asociación)
  const addGeneralIncome = async (incomeData: Omit<GeneralIncome, 'id' | 'createdAt'>) => {
    const newId = `gen-inc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    
    const newIncome: GeneralIncome = {
      ...incomeData,
      id: newId,
      createdAt: nowIso
    };

    if (useMockData) {
      setDemoGeneralIncomes(prev => [newIncome, ...prev]);
      return { success: true, message: 'Ingreso general registrado en modo demo.' };
    }

    setGeneralIncomes(prev => [newIncome, ...prev]);
    try {
      if (isFirebaseConfigured() && db) {
        await saveGeneralIncomeFirestore(newIncome);
      }
      return { success: true, message: 'Ingreso general registrado con éxito.' };
    } catch (error: any) {
      console.error('Error saving general income:', error);
      setGeneralIncomes(prev => prev.filter(i => i.id !== newId));
      return { success: false, message: error.message || 'Error al guardar el ingreso general.' };
    }
  };

  const updateGeneralIncome = async (id: string, updates: Partial<GeneralIncome>) => {
    if (useMockData) {
      setDemoGeneralIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      return;
    }

    setGeneralIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try {
      if (isFirebaseConfigured() && db) {
        await updateGeneralIncomeFirestore(id, updates);
      }
    } catch (error) {
      console.error('Error updating general income:', error);
    }
  };

  const deleteGeneralIncome = async (id: string) => {
    if (useMockData) {
      setDemoGeneralIncomes(prev => prev.filter(i => i.id !== id));
      return;
    }

    setGeneralIncomes(prev => prev.filter(i => i.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteGeneralIncomeFirestore(id);
      }
    } catch (error) {
      console.error('Error deleting general income:', error);
    }
  };

  // General Expenses (Asociación)
  const addGeneralExpense = async (expenseData: Omit<GeneralExpense, 'id' | 'createdAt'>) => {
    const newId = `gen-exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    
    const newExpense: GeneralExpense = {
      ...expenseData,
      id: newId,
      createdAt: nowIso
    };

    if (useMockData) {
      setDemoGeneralExpenses(prev => [newExpense, ...prev]);
      return { success: true, message: 'Gasto general registrado en modo demo.' };
    }

    setGeneralExpenses(prev => [newExpense, ...prev]);
    try {
      if (isFirebaseConfigured() && db) {
        await saveGeneralExpenseFirestore(newExpense);
      }
      return { success: true, message: 'Gasto general registrado con éxito.' };
    } catch (error: any) {
      console.error('Error saving general expense:', error);
      setGeneralExpenses(prev => prev.filter(e => e.id !== newId));
      return { success: false, message: error.message || 'Error al guardar el gasto general.' };
    }
  };

  const updateGeneralExpense = async (id: string, updates: Partial<GeneralExpense>) => {
    if (useMockData) {
      setDemoGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      return;
    }

    setGeneralExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      if (isFirebaseConfigured() && db) {
        await updateGeneralExpenseFirestore(id, updates);
      }
    } catch (error) {
      console.error('Error updating general expense:', error);
    }
  };

  const deleteGeneralExpense = async (id: string) => {
    if (useMockData) {
      setDemoGeneralExpenses(prev => prev.filter(e => e.id !== id));
      return;
    }

    setGeneralExpenses(prev => prev.filter(e => e.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteGeneralExpenseFirestore(id);
      }
    } catch (error) {
      console.error('Error deleting general expense:', error);
    }
  };

  // Annual Membership Fees (Estado de Cuotas de Socios)
  const saveAnnualMembershipFees = async (record: AnnualMembershipFeesRecord): Promise<{ success: boolean; message: string }> => {
    const feeItems = Object.values(record.fees || {});
    const totalMembers = feeItems.length;
    const paidItems = feeItems.filter(f => f.status === 'pagada');
    const paidMembersCount = paidItems.length;
    const totalAssigned = feeItems.reduce((sum, f) => sum + (Number(f.feeAmount) || 0), 0);
    const totalCollected = paidItems.reduce((sum, f) => sum + (Number(f.feeAmount) || 0), 0);

    const updatedRecord: AnnualMembershipFeesRecord = {
      ...record,
      totalAssigned,
      totalCollected,
      totalMembers,
      paidMembersCount,
      updatedAt: new Date().toISOString()
    };

    const consolidatedIncomeId = `cuotas_socios_${record.year}`;
    const consolidatedIncomeConcept = `CUOTAS SOCIOS AÑO ${record.year}`;
    const consolidatedPayer = `Socios Asociación (${paidMembersCount}/${totalMembers} pagadas)`;
    const status: GeneralIncomeStatus = (totalCollected >= totalAssigned && totalAssigned > 0) ? 'cobrado' : 'pendiente';

    if (useMockData) {
      setDemoAnnualMembershipFees(prev => {
        const idx = prev.findIndex(r => r.id === record.id || r.year === record.year);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedRecord;
          return next;
        }
        return [updatedRecord, ...prev];
      });

      setDemoGeneralIncomes(prev => {
        const existingIdx = prev.findIndex(i => i.id === consolidatedIncomeId || (i.isConsolidatedFeeRecord && i.feeYear === record.year));
        if (existingIdx >= 0) {
          const updatedIncomes = [...prev];
          updatedIncomes[existingIdx] = {
            ...updatedIncomes[existingIdx],
            concept: consolidatedIncomeConcept,
            payerName: consolidatedPayer,
            amount: totalAssigned,
            paidAmount: totalCollected,
            status,
            date: `${record.year}-01-01`,
            isConsolidatedFeeRecord: true,
            feeYear: record.year
          };
          return updatedIncomes;
        } else {
          const newConsolidated: GeneralIncome = {
            id: consolidatedIncomeId,
            concept: consolidatedIncomeConcept,
            payerName: consolidatedPayer,
            amount: totalAssigned,
            paidAmount: totalCollected,
            type: 'cuota_socio',
            status,
            date: `${record.year}-01-01`,
            notes: `Registro permanente consolidado de cuotas anuales de socios del ejercicio ${record.year}.`,
            isConsolidatedFeeRecord: true,
            feeYear: record.year,
            createdAt: new Date().toISOString()
          };
          return [newConsolidated, ...prev];
        }
      });

      return { success: true, message: `Cuotas de socios del año ${record.year} actualizadas correctamente en modo demo.` };
    }

    setAnnualMembershipFees(prev => {
      const idx = prev.findIndex(r => r.id === record.id || r.year === record.year);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [updatedRecord, ...prev];
    });

    try {
      if (isFirebaseConfigured() && db) {
        await saveAnnualMembershipFeesFirestore(updatedRecord);

        // Find or create consolidated general income
        const existingIncome = generalIncomes.find(i => i.id === consolidatedIncomeId || (i.isConsolidatedFeeRecord && i.feeYear === record.year));
        if (existingIncome) {
          await updateGeneralIncomeFirestore(existingIncome.id, {
            concept: consolidatedIncomeConcept,
            payerName: consolidatedPayer,
            amount: totalAssigned,
            paidAmount: totalCollected,
            status,
            date: `${record.year}-01-01`,
            isConsolidatedFeeRecord: true,
            feeYear: record.year
          });
        } else {
          await saveGeneralIncomeFirestore({
            id: consolidatedIncomeId,
            concept: consolidatedIncomeConcept,
            payerName: consolidatedPayer,
            amount: totalAssigned,
            paidAmount: totalCollected,
            type: 'cuota_socio',
            status,
            date: `${record.year}-01-01`,
            notes: `Registro permanente consolidado de cuotas anuales de socios del ejercicio ${record.year}.`,
            isConsolidatedFeeRecord: true,
            feeYear: record.year,
            createdAt: new Date().toISOString()
          });
        }
      }
      return { success: true, message: `Cuotas de socios del año ${record.year} sincronizadas con el registro permanente.` };
    } catch (error: any) {
      console.error('Error saving annual membership fees:', error);
      return { success: false, message: error.message || 'Error al guardar el estado de cuotas de socios.' };
    }
  };

  // Contact Message Handlers
  const sendContactMessage = async (
    msgData: Omit<ContactMessage, 'id' | 'createdAt' | 'read' | 'status'>
  ): Promise<{ success: boolean; message: string; messageSaved?: boolean; emailSent?: boolean; messageId?: string }> => {
    if (useMockData) {
      const newId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newMsg: ContactMessage = {
        ...msgData,
        id: newId,
        read: false,
        status: 'nuevo',
        createdAt: new Date().toISOString(),
        emailDeliveryStatus: 'simulated'
      };
      setDemoContactMessages(prev => [newMsg, ...prev]);
      return { 
        success: true, 
        message: 'Tu mensaje ha sido enviado correctamente (Modo Simulación).',
        messageSaved: true,
        emailSent: true,
        messageId: newId
      };
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          messageSaved: true,
          emailSent: true,
          messageId: data.messageId,
          message: data.message || 'Tu mensaje ha sido enviado y registrado correctamente.'
        };
      } else if (data.messageSaved && !data.emailSent) {
        // Warning case: saved in Firestore, but SMTP failed (status 207)
        return {
          success: false,
          messageSaved: true,
          emailSent: false,
          messageId: data.messageId,
          message: data.error || 'El mensaje se ha registrado en el sistema, pero no se pudo enviar la copia por correo electrónico.'
        };
      } else {
        return {
          success: false,
          messageSaved: false,
          emailSent: false,
          message: data.error || 'Error al procesar el mensaje de contacto.'
        };
      }
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      return { 
        success: false, 
        messageSaved: false,
        emailSent: false,
        message: error.message || 'Error de conexión al enviar el mensaje de contacto.' 
      };
    }
  };

  const markContactMessageRead = async (id: string, read: boolean = true) => {
    if (useMockData) {
      setDemoContactMessages(prev => prev.map(m => m.id === id ? { ...m, read, status: read && m.status === 'nuevo' ? 'leido' : m.status } : m));
      return;
    }

    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, read, status: read && m.status === 'nuevo' ? 'leido' : m.status } : m));
    try {
      if (isFirebaseConfigured() && db) {
        await updateContactMessageFirestore(id, { read, status: read ? 'leido' : 'nuevo' });
      }
    } catch (error) {
      console.error('Error marking contact message read:', error);
    }
  };

  const markContactAlertSeen = async (id: string, seenBy?: string, seenByUid?: string) => {
    const timestamp = new Date().toISOString();
    const actorName = seenBy || 'Administración';
    const actorUid = seenByUid || 'admin';

    if (useMockData) {
      setDemoContactMessages(prev => prev.map(m => m.id === id ? {
        ...m,
        contactAlertSeenAt: timestamp,
        contactAlertSeenBy: actorName,
        contactAlertSeenByUid: actorUid
      } : m));
      return;
    }

    setContactMessages(prev => prev.map(m => m.id === id ? {
      ...m,
      contactAlertSeenAt: timestamp,
      contactAlertSeenBy: actorName,
      contactAlertSeenByUid: actorUid
    } : m));

    try {
      if (isFirebaseConfigured() && db) {
        await markContactAlertSeenFirestore(id, actorName, actorUid);
      }
    } catch (error) {
      console.error('Error marking contact alert seen:', error);
    }
  };

  const updateContactMessageStatus = async (id: string, status: 'nuevo' | 'leido' | 'respondido', replyNotes?: string) => {
    const updates: Partial<ContactMessage> = {
      status,
      read: true,
      ...(status === 'respondido' ? { repliedAt: new Date().toISOString(), replyNotes } : {})
    };

    if (useMockData) {
      setDemoContactMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }

    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    try {
      if (isFirebaseConfigured() && db) {
        await updateContactMessageFirestore(id, updates);
      }
    } catch (error) {
      console.error('Error updating contact message status:', error);
    }
  };

  const deleteContactMessage = async (id: string) => {
    if (useMockData) {
      setDemoContactMessages(prev => prev.filter(m => m.id !== id));
      return;
    }

    setContactMessages(prev => prev.filter(m => m.id !== id));
    try {
      if (isFirebaseConfigured() && db) {
        await deleteContactMessageFirestore(id);
      }
    } catch (error) {
      console.error('Error deleting contact message:', error);
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
      contactMessages: displayContactMessages,
      unreadMessagesCount,
      unreadNotificationsCount,
      metrics: displayMetrics,
      isConnected,
      connectionError,
      getActivityById,
      getParticipantsByActivityId,
      addActivity,
      addTwoShiftCata,
      updateActivity,
      deleteActivity,
      quickUpdateActivity,
      reserveSpots,
      addManualParticipant,
      updateParticipant,
      deleteParticipant,
      markAttendance,
      executeParticipantTransition,
      executeAdvancedAttendanceCorrection,
      closeActivityAsCelebrated,
      executeAdministrativeMigration,
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
      // general association accounting
      generalIncomes: displayGeneralIncomes,
      addGeneralIncome,
      updateGeneralIncome,
      deleteGeneralIncome,
      generalExpenses: displayGeneralExpenses,
      addGeneralExpense,
      updateGeneralExpense,
      deleteGeneralExpense,
      // annual membership fees
      annualMembershipFees: displayAnnualMembershipFees,
      saveAnnualMembershipFees,
      // contact messages
      sendContactMessage,
      markContactMessageRead,
      markContactAlertSeen,
      updateContactMessageStatus,
      deleteContactMessage,
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
