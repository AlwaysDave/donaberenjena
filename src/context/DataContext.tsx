import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, CataActivity, CursoActivity, ReservationFormData, ViajeActivity, WebMetric } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';
import {
  subscribeToActivitiesFirestore,
  subscribeToMetricsFirestore,
  saveActivityFirestore,
  updateActivityFirestore,
  deleteActivityFirestore,
  reserveSpotsFirestore
} from '../services/firestoreService';

interface DataContextType {
  activities: Activity[];
  catas: CataActivity[];
  cursos: CursoActivity[];
  viajes: ViajeActivity[];
  metrics: WebMetric;
  isConnected: boolean;
  connectionError: string | null;
  getActivityById: (id: string) => Activity | undefined;
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  quickUpdateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  reserveSpots: (id: string, spots: number, reservationData: ReservationFormData) => Promise<{ success: boolean; message: string }>;
  incrementViews: (id: string) => void;
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
  const [metrics, setMetrics] = useState<WebMetric>(DEFAULT_METRICS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Firestore real-time subscriptions
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

  const catas = activities.filter((a): a is CataActivity => a.type === 'cata');
  const cursos = activities.filter((a): a is CursoActivity => a.type === 'curso');
  const viajes = activities.filter((a): a is ViajeActivity => a.type === 'viaje');

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find(a => a.id === id);
  };

  const addActivity = async (activity: Activity) => {
    await saveActivityFirestore(activity);
  };

  const updateActivity = async (updated: Activity) => {
    await saveActivityFirestore(updated);
  };

  const quickUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    await updateActivityFirestore(id, updates);
  };

  const deleteActivity = async (id: string) => {
    // Optimistic local state removal so UI updates immediately
    setActivities(prev => prev.filter(a => a.id !== id));
    await deleteActivityFirestore(id);
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

    try {
      await reserveSpotsFirestore(id, requestedSpots);
      return { 
        success: true, 
        message: `¡Plazas reservadas con éxito para ${reservationData.fullName}! En breve recibirás un correo con las instrucciones de acceso.` 
      };
    } catch (err: any) {
      console.error('Error executing reservation on Firestore:', err);
      return {
        success: false,
        message: 'No se pudo completar la reserva en el servidor. Comprueba la conexión o inténtalo más tarde.'
      };
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

  return (
    <DataContext.Provider value={{
      activities,
      catas,
      cursos,
      viajes,
      metrics,
      isConnected,
      connectionError,
      getActivityById,
      addActivity,
      updateActivity,
      deleteActivity,
      quickUpdateActivity,
      reserveSpots,
      incrementViews
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
