import { createContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, firestore } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define user type
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  preferences?: {
    preferredGenre?: string;
    preferredTempo?: number;
  };
}

// Auth context state interface
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Auth context interface
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
  updateUserPreferences: (preferences: User['preferences']) => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define action types
type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: User | null }
  | { type: 'AUTH_INIT_ERROR'; payload: string }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_USER'; payload: User };

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return { ...state, loading: true };
    case 'AUTH_INIT_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'AUTH_INIT_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SIGN_OUT':
      return { ...state, user: null, error: null };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth
  const initializeAuth = useCallback(() => {
    dispatch({ type: 'AUTH_INIT_START' });
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            const userData = userDoc.data();
            
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData?.displayName,
              photoURL: firebaseUser.photoURL || userData?.photoURL,
              preferences: userData?.preferences,
            };
            
            dispatch({ type: 'AUTH_INIT_SUCCESS', payload: user });
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to fetch user data';
            dispatch({ type: 'AUTH_INIT_ERROR', payload: error });
          }
        } else {
          dispatch({ type: 'AUTH_INIT_SUCCESS', payload: null });
        }
      },
      (error) => {
        dispatch({ type: 'AUTH_INIT_ERROR', payload: error.message });
      }
    );

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Use effect to initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || userData?.displayName,
        photoURL: firebaseUser.photoURL || userData?.photoURL,
        preferences: userData?.preferences,
      };
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to login';
      dispatch({ type: 'LOGIN_ERROR', payload: error });
    }
  };

  // Register function
  const register = async (email: string, password: string, displayName?: string) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || null,
        photoURL: null,
        preferences: {
          preferredGenre: 'classical',
          preferredTempo: 100
        }
      };
      
      await setDoc(doc(firestore, 'users', user.uid), user);
      
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to register';
      dispatch({ type: 'REGISTER_ERROR', payload: error });
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      dispatch({ type: 'SIGN_OUT' });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to sign out';
      dispatch({ type: 'LOGIN_ERROR', payload: error });
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: User['preferences']) => {
    if (!state.user) return;
    
    try {
      const userRef = doc(firestore, 'users', state.user.uid);
      await setDoc(userRef, { preferences }, { merge: true });
      
      const updatedUser = {
        ...state.user,
        preferences
      };
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update preferences';
      dispatch({ type: 'LOGIN_ERROR', payload: error });
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    signOut,
    initializeAuth,
    updateUserPreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};