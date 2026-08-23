import React, { createContext, useContext, useState, useEffect } from 'react';
import { Activity, CataActivity, CursoActivity, ReservationFormData, ViajeActivity, WebMetric } from '../types';
import { getStoredActivities, getStoredMetrics, saveStoredActivities, saveStoredMetrics } from '../services/firebase';
import { INITIAL_CATAS, INITIAL_CURSOS, INITIAL_VIAJES, INITIAL_WEB_METRICS } from '../data/mockData';

interface DataContextType {
  activities: Activity[];
  catas: CataActivity[];
  cursos: CursoActivity[];
  viajes: ViajeActivity[];
  metrics: WebMetric;
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

  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  useEffect(() => {
    saveStoredMetrics(metrics);
  }, [metrics]);

  const catas = activities.filter((a): a is CataActivity => a.type === 'cata');
  const cursos = activities.filter((a): a is CursoActivity => a.type === 'curso');
  const viajes = activities.filter((a): a is ViajeActivity => a.type === 'viaje');

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find(a => a.id === id);
  };

  const addActivity = async (activity: Activity) => {
    const newActivities = [activity, ...activities];
    setActivities(newActivities);
  };

  const updateActivity = async (updated: Activity) => {
    const newActivities = activities.map(a => a.id === updated.id ? updated : a);
    setActivities(newActivities);
  };

  const quickUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    const newActivities = activities.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...updates,
          updatedAt: new Date().toISOString().split('T')[0]
        } as Activity;
      }
      return a;
    });
    setActivities(newActivities);
  };

  const deleteActivity = async (id: string) => {
    const newActivities = activities.filter(a => a.id !== id);
    setActivities(newActivities);
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

    const updated = {
      ...activity,
      bookedSpots: activity.bookedSpots + requestedSpots,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    await updateActivity(updated);

    // Update metrics
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
    saveStoredActivities(defaultList);
    saveStoredMetrics(INITIAL_WEB_METRICS);
  };

  return (
    <DataContext.Provider value={{
      activities,
      catas,
      cursos,
      viajes,
      metrics,
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
