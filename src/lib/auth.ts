import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppUser, UserRole } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore to enable force long polling which is more reliable in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  
  if (errInfo.error.includes('the client is offline')) {
    console.warn('Firestore reports offline. Attempting to force network reconnect...');
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as mandated by skill
export async function testConnection() {
  try {
    // Try to reach server directly to bypass any stale offline cache
    await getDocFromServer(doc(db, '_internal_', 'probe'));
    console.log('Firestore Connection: ONLINE');
  } catch (error: any) {
    if (error.message.includes('the client is offline')) {
       console.error("Firestore initialization failed: Client is offline. Verify configuration.");
    }
  }
}

const provider = new GoogleAuthProvider();
// Required scopes for Sheets and Drive
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string, profile: AppUser) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        const profile = await getUserProfile(user.uid);
        
        if (profile && onAuthSuccess) {
          onAuthSuccess(user, token, profile);
        } else if (!profile && !isSigningIn) {
          // If no profile exists and we're not currently in the sign-in flow,
          // create one with default role
          const newProfile = await createUserProfile(user);
          if (onAuthSuccess) onAuthSuccess(user, token, newProfile);
        }
      } catch (error) {
        console.error('Auth refresh error:', error);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  const path = `users/${uid}`;
  try {
    // Attempt with both cache and server
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as AppUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
};

export const createUserProfile = async (user: User): Promise<AppUser> => {
  const profile: AppUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'delivery', // default role as requested
  };
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: AppUser } | null> => {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    // Note: This accessToken is for Google APIs (Sheets), not the Firebase ID token
    const googleAccessToken = credential?.accessToken || '';
    
    // Proving identity then load profile
    let profile = await getUserProfile(result.user.uid);
    if (!profile) {
      profile = await createUserProfile(result.user);
    }

    cachedAccessToken = googleAccessToken;
    return { user: result.user, accessToken: googleAccessToken, profile };
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error('Sign-in popup was blocked by the browser.');
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
