import { auth, getStoredAdminSession } from './firebase';

/**
 * Retrieves the authorization header with Bearer token for admin API requests.
 * In Firebase mode, fetches the fresh ID token from the signed-in Firebase user.
 * In local mock/dev mode, supplies a dev session bearer token.
 */
export async function getAdminAuthHeader(): Promise<Record<string, string>> {
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch (err) {
    console.warn('Could not get Firebase Auth ID token:', err);
  }

  const session = getStoredAdminSession();
  if (session) {
    return { Authorization: `Bearer dev-session-${session.uid || 'admin'}` };
  }

  return { Authorization: 'Bearer dev-session-admin' };
}
