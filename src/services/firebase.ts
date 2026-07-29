import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'candidate';
  displayName?: string;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists, if not create as candidate
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const role = user.email === 'jhonkiladi@gmail.com' ? 'admin' : 'candidate';
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: role,
        displayName: user.displayName || ''
      };
      await setDoc(doc(db, 'users', user.uid), profile);
      return profile;
    }
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const saveInterviewResult = async (result: any) => {
  try {
    await addDoc(collection(db, 'interviews'), {
      ...result,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving interview result", error);
  }
};

export const getInterviews = async () => {
  try {
    const q = query(collection(db, 'interviews'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting interviews", error);
    return [];
  }
};
