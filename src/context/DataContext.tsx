import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, CataActivity, CursoActivity, ReservationFormData, ViajeActivity, WebMetric } from '../types';
import { 
  getStoredActivities, 
  getStoredMetrics, 
  saveStoredActivities, 
  saveStoredMetrics,
  isFirebaseConfigured
} from '../services/firebase';
import {
  subscribeToActivitiesFirestore,
  subscribeToMetricsFirestore,
  saveActivityFirestore,
  updateActivityFirestore,
  deleteActivityFirestore,
  reserveSpotsFirestore
} from '../services/firestoreService';
import { INITIAL_CATAS, INITIAL_CURSOS, INITIAL_VIAJES, INITIAL_WEB_METRICS } from '../data/mockData';

interface DataContextType {
  activities: Activity[];
  catas: CataActivity[];
  cursos: CursoActivity[];
  viajes: ViajeActivity[];
  metrics: WebMetric;
  isDemoMode: boolean;
  getActivityById: (id: string) => Activity | undefined;
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  quickUpdateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  reserveSpots: (id: string, spots: number, reservationData: ReservationFormData) => Promise<{ success: boolean; message: string }>;
  incrementViews: (id: string) => void;
  resetToDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(() => getStoredActivities());
  const [metrics, setMetrics] = useState<WebMetric>(() => getStoredMetrics());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured());

  // Firestore real-time subscriptions with fallback to localStorage
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsDemoMode(true);
      return;
    }

    let unsubActivities: (() => void) | null = null;
    let unsubMetrics: (() => void) | null = null;

    try {
      unsubActivities = subscribeToActivitiesFirestore(
        (firestoreActivities) => {
          // If the Firestore collection has data, update state and disable demo mode
          if (firestoreActivities.length > 0) {
            setActivities(firestoreActivities);
            setIsDemoMode(false);
          } else {
            // First time empty collection: seed initial or keep fallback
            setIsDemoMode(false);
            setActivities(firestoreActivities);
          }
        },
        (err) => {
          console.warn('Falling back to local demo activities mode due to Firestore error:', err);
          setIsDemoMode(true);
          setActivities(getStoredActivities());
        }
      );
    } catch (err) {
      console.warn('Could not initialize activities subscription:', err);
      setIsDemoMode(true);
    }

    try {
      unsubMetrics = subscribeToMetricsFirestore(
        (firestoreMetrics) => {
          setMetrics(firestoreMetrics);
        },
        (err) => {
          console.warn('Falling back to local demo metrics:', err);
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

  // Save to localStorage ONLY when in Demo mode
  useEffect(() => {
    if (isDemoMode) {
      saveStoredActivities(activities);
    }
  }, [activities, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      saveStoredMetrics(metrics);
    }
  }, [metrics, isDemoMode]);

  const catas = activities.filter((a): a is CataActivity => a.type === 'cata');
  const cursos = activities.filter((a): a is CursoActivity => a.type === 'curso');
  const viajes = activities.filter((a): a is ViajeActivity => a.type === 'viaje');

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find(a => a.id === id);
  };

  const addActivity = async (activity: Activity) => {
    if (!isDemoMode) {
      try {
        await saveActivityFirestore(activity);
        // State will update reactively via onSnapshot
        return;
      } catch (err) {
        console.error('Error saving activity to Firestore, falling back to local:', err);
      }
    }
    // Demo mode local update
    setActivities(prev => [activity, ...prev]);
  };

  const updateActivity = async (updated: Activity) => {
    if (!isDemoMode) {
      try {
        await saveActivityFirestore(updated);
        // State will update reactively via onSnapshot
        return;
      } catch (err) {
        console.error('Error updating activity in Firestore, falling back to local:', err);
      }
    }
    // Demo mode local update
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const quickUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    if (!isDemoMode) {
      try {
        await updateActivityFirestore(id, updates);
        // State will update reactively via onSnapshot
        return;
      } catch (err) {
        console.error('Error quick-updating activity in Firestore, falling back to local:', err);
      }
    }
    // Demo mode local update
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...updates,
          updatedAt: new Date().toISOString().split('T')[0]
        } as Activity;
      }
      return a;
    }));
  };

  const deleteActivity = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteActivityFirestore(id);
        // State will update reactively via onSnapshot
        return;
      } catch (err) {
        console.error('Error deleting activity in Firestore, falling back to local:', err);
      }
    }
    // Demo mode local update
    setActivities(prev => prev.filter(a => a.id !== id));
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

    if (!isDemoMode) {
      try {
        await reserveSpotsFirestore(id, requestedSpots);
        // Metric locally updated for UI feedback
        setMetrics(prev => ({
          ...prev,
          activeReservationsCount: prev.activeReservationsCount + 1
        }));
        return { 
          success: true, 
          message: `¡Plazas reservadas con éxito para ${reservationData.fullName}! En breve recibirás un correo con las instrucciones de acceso.` 
        };
      } catch (err: any) {
        console.error('Error executing reservation on Firestore:', err);
        return {
          success: false,
          message: 'No se pudo completar la reserva en el servidor. Por favor, inténtalo de nuevo o contacta con la asociación.'
        };
      }
    }

    // Demo Mode local update
    const updated = {
      ...activity,
      bookedSpots: activity.bookedSpots + requestedSpots,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));

    setMetrics(prev => ({
      ...prev,
      activeReservationsCount: prev.activeReservationsCount + 1
    }));

    return { 
      success: true, 
      message: `¡Plazas reservadas con éxito para ${reservationData.fullName}! En breve recibirás un correo con las instrucciones de acceso.` 
    };
  };

  const incrementViews = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    // Local client-side tracking (avoiding unauthenticated public writes to aggregated summary document)
    // Note: In production, aggregate web analytics should be processed via Cloud Functions or server-side telemetry.
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

  const resetToDefaults = () => {
    const defaultList: Activity[] = [...INITIAL_CATAS, ...INITIAL_CURSOS, ...INITIAL_VIAJES];
    setActivities(defaultList);
    setMetrics(INITIAL_WEB_METRICS);
    if (isDemoMode) {
      saveStoredActivities(defaultList);
      saveStoredMetrics(INITIAL_WEB_METRICS);
    }
  };

  return (
    <DataContext.Provider value={{
      activities,
      catas,
      cursos,
      viajes,
      metrics,
      isDemoMode,
      getActivityById,
      addActivity,
      updateActivity,
      deleteActivity,
      quickUpdateActivity,
      reserveSpots,
      incrementViews,
      resetToDefaults
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
