import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { AdminRole, AdminUser } from '../types';
import { auth, isFirebaseConfigured, getStoredAdminSession, saveStoredAdminSession } from '../services/firebase';
import { fetchAdminRole } from '../services/firestoreService';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isDemoAuth: boolean;
  authError: string | null;
  login: (email: string, password?: string) => Promise<void>;
  loginAsDemo: (role: AdminRole) => void;
  switchRole: (role: AdminRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Credenciales de acceso incorrectas. Por favor, comprueba el correo y la contraseña.';
    case 'auth/user-disabled':
      return 'Esta cuenta de administrador ha sido deshabilitada.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, inténtalo de nuevo en unos minutos.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet al contactar con el servidor de autenticación.';
    default:
      return error?.message || 'Error al iniciar sesión en el panel de administración.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredAdminSession());
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const hasFirebase = isFirebaseConfigured() && Boolean(auth);

  useEffect(() => {
    if (!hasFirebase || !auth) {
      setIsAuthReady(true);
      return;
    }

    // Sync session with Firebase Auth on load and changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const adminInfo = await fetchAdminRole(firebaseUser.uid);
          if (adminInfo) {
            const adminUser: AdminUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: adminInfo.name || firebaseUser.email?.split('@')[0] || 'Administrador',
              baseRole: adminInfo.role,
              role: adminInfo.role,
              isDemo: false
            };
            setUser(adminUser);
            saveStoredAdminSession(adminUser);
          } else {
            // User exists in Firebase Auth but has no document in `admins/{uid}`
            console.warn(`User ${firebaseUser.uid} authenticated without an entry in admins/{uid}`);
            await signOut(auth!);
            setUser(null);
            saveStoredAdminSession(null);
            setAuthError('Esta cuenta no tiene un rol de administrador asignado.');
          }
        } catch (err) {
          console.error('Error resolving admin profile from Firestore:', err);
          setUser(null);
          saveStoredAdminSession(null);
        }
      } else {
        // If not in demo mode, clear user when signed out from Firebase Auth
        if (!user?.isDemo) {
          setUser(null);
          saveStoredAdminSession(null);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [hasFirebase]);

  const login = async (email: string, password?: string) => {
    setAuthError(null);

    if (!email || !password) {
      const msg = 'Por favor, introduce el correo electrónico y la contraseña.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!auth) {
      const msg = 'El servicio de autenticación de Firebase no está disponible. Revisa la configuración en el archivo .env.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;
      const adminInfo = await fetchAdminRole(fbUser.uid);

      if (!adminInfo) {
        await signOut(auth);
        setUser(null);
        saveStoredAdminSession(null);
        const msg = 'Esta cuenta no tiene un rol de administrador asignado en la colección "admins" de la base de datos.';
        setAuthError(msg);
        throw new Error(msg);
      }

      const loggedUser: AdminUser = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        name: adminInfo.name || fbUser.email?.split('@')[0] || 'Administrador',
        baseRole: adminInfo.role,
        role: adminInfo.role, // Defaults to configured role
        isDemo: false
      };

      setUser(loggedUser);
      saveStoredAdminSession(loggedUser);
    } catch (err: any) {
      const readableMsg = mapFirebaseAuthError(err);
      setAuthError(readableMsg);
      throw new Error(readableMsg);
    }
  };

  const loginAsDemo = (role: AdminRole) => {
    // Unused when demo access is disabled
    setAuthError(null);
  };

  const switchRole = (newRole: AdminRole) => {
    if (!user) return;
    // Allow any logged-in admin to switch between simple and advanced display views
    const updatedUser: AdminUser = {
      ...user,
      role: newRole
    };
    setUser(updatedUser);
    saveStoredAdminSession(updatedUser);
  };

  const logout = async () => {
    setAuthError(null);
    if (hasFirebase && auth && !user?.isDemo) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out from Firebase Auth:', err);
      }
    }
    setUser(null);
    saveStoredAdminSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: Boolean(user), 
      isAuthReady,
      isDemoAuth: !hasFirebase || Boolean(user?.isDemo),
      authError,
      login, 
      loginAsDemo, 
      switchRole, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
