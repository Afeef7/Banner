import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Load configuration from local JSON file
const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Initialize client SDK (safely checking getApps)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Seeding function to populate persistent databases with initial demo data
async function seedDatabase() {
  try {
    // 1. Seed Demo User Profiles
    const adminRef = doc(db, "users", "demo-admin-123");
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      console.log("Seeding Admin Demo account...");
      const adminHash = await bcrypt.hash("Admin@123", 12);
      await setDoc(adminRef, {
        email: "jhonkiladi@gmail.com",
        passwordHash: adminHash,
        displayName: "Dr. Bruce Banner",
        role: "admin",
        createdAt: serverTimestamp()
      });
    }

    const candidateRef = doc(db, "users", "demo-candidate-123");
    const candidateSnap = await getDoc(candidateRef);
    if (!candidateSnap.exists()) {
      console.log("Seeding Candidate Demo account...");
      const candidateHash = await bcrypt.hash("Candidate@123", 12);
      await setDoc(candidateRef, {
        email: "candidate@banner.ai",
        passwordHash: candidateHash,
        displayName: "Jhon Doe",
        role: "candidate",
        createdAt: serverTimestamp()
      });
    }

    // 2. Seed Custom Question Bank
    const q1Ref = doc(db, "questions", "q1");
    const q1Snap = await getDoc(q1Ref);
    if (!q1Snap.exists()) {
      console.log("Seeding default question q1...");
      await setDoc(q1Ref, {
        question: "Describe a situation where you had to debug a complex distributed deadlock in production.",
        category: "System Design",
        targetRole: "Software Engineer",
        difficulty: "Senior",
        expectedKeywords: ["deadlock", "mutex", "thread dump", "race condition"]
      });
    }

    const q2Ref = doc(db, "questions", "q2");
    const q2Snap = await getDoc(q2Ref);
    if (!q2Snap.exists()) {
      console.log("Seeding default question q2...");
      await setDoc(q2Ref, {
        question: "Explain how you approach optimizing slow database queries with structural indexes.",
        category: "Databases",
        targetRole: "Software Engineer",
        difficulty: "Mid",
        expectedKeywords: ["indexing", "execution plan", "query optimiser", "explain analyze"]
      });
    }

    // 3. Seed Default System Calibration Settings
    const configRef = doc(db, "system_config", "dr_banner_defaults");
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      console.log("Seeding default system calibration configuration...");
      await setDoc(configRef, {
        modelName: "gemini-2.5-flash",
        atsWeight: 40,
        confidenceWeight: 30,
        communicationWeight: 30,
        features: {
          liveAudio: true,
          resumeAts: true,
          customQuestions: true,
          learningRoadmaps: true
        }
      });
    }

    // 4. Seed Demo Candidate Notifications
    const n1Ref = doc(db, "notifications", "n1");
    const n1Snap = await getDoc(n1Ref);
    if (!n1Snap.exists()) {
      console.log("Seeding demo candidate notification n1...");
      await setDoc(n1Ref, {
        userId: "demo-candidate-123",
        title: "Resume Analyzed Successfully",
        message: "Your resume has been parsed. ATS Score: 84%. Career Fit matches: Software Engineer.",
        type: "roadmap",
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    const n2Ref = doc(db, "notifications", "n2");
    const n2Snap = await getDoc(n2Ref);
    if (!n2Snap.exists()) {
      console.log("Seeding demo candidate notification n2...");
      await setDoc(n2Ref, {
        userId: "demo-candidate-123",
        title: "Ready for Live Evaluation",
        message: "Dr. Banner is available to conduct your Placement Interview session.",
        type: "interview",
        isRead: true,
        createdAt: serverTimestamp()
      });
    }

    console.log("Database seed check completed successfully.");
  } catch (error) {
    console.error("Error seeding Database:", error);
  }
}

// Trigger Seeding in Background asynchronously
seedDatabase();

// ==========================================================
// 1. USER PROFILE OPERATIONS
// ==========================================================

export async function getUserById(id: string): Promise<any> {
  try {
    const userDoc = await getDoc(doc(db, "users", id));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    }
  } catch (error) {
    console.error(`Firestore getUserById Error (id: ${id}):`, error);
  }
  return null;
}

export async function getUserByEmail(email: string): Promise<any> {
  try {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      return {
        ...data,
        id: firstDoc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    }
  } catch (error) {
    console.error(`Firestore getUserByEmail Error (email: ${email}):`, error);
  }
  return null;
}

export async function createUser(id: string, user: any) {
  try {
    await setDoc(doc(db, "users", id), {
      ...user,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Firestore createUser Error:", error);
    throw error;
  }
}

export async function updateUser(id: string, updates: any) {
  try {
    await setDoc(doc(db, "users", id), updates, { merge: true });
    return true;
  } catch (error) {
    console.error(`Firestore updateUser Error (id: ${id}):`, error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await deleteDoc(doc(db, "users", id));
    return true;
  } catch (error) {
    console.error(`Firestore deleteUser Error (id: ${id}):`, error);
    throw error;
  }
}

export async function getAllUsers(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });
  } catch (error) {
    console.error("Firestore getAllUsers Error:", error);
    return [];
  }
}

// ==========================================================
// 2. INTERVIEW SESSION OPERATIONS
// ==========================================================

export async function getSessionById(id: string): Promise<any> {
  try {
    const sessionDoc = await getDoc(doc(db, "interviews", id));
    if (sessionDoc.exists()) {
      const data = sessionDoc.data();
      return {
        ...data,
        id,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
      };
    }
  } catch (error) {
    console.error(`Firestore getSessionById Error (id: ${id}):`, error);
  }
  return null;
}

export async function createSession(id: string, session: any) {
  try {
    await setDoc(doc(db, "interviews", id), {
      ...session,
      startedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Firestore createSession Error:", error);
    throw error;
  }
}

export async function updateSession(id: string, updates: any) {
  try {
    // If we have startedAt or completedAt as raw Date objects, let's keep them as is or map them
    const sanitizedUpdates = { ...updates };
    if (updates.completedAt instanceof Date) {
      sanitizedUpdates.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    await setDoc(doc(db, "interviews", id), sanitizedUpdates, { merge: true });
    return true;
  } catch (error) {
    console.error(`Firestore updateSession Error (id: ${id}):`, error);
    throw error;
  }
}

export async function deleteSession(id: string) {
  try {
    await deleteDoc(doc(db, "interviews", id));
    return true;
  } catch (error) {
    console.error(`Firestore deleteSession Error (id: ${id}):`, error);
    throw error;
  }
}

export async function getAllSessions(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "interviews"));
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
      };
    });
  } catch (error) {
    console.error("Firestore getAllSessions Error:", error);
    return [];
  }
}

export async function getSessionsByUserId(userId: string): Promise<any[]> {
  try {
    const q = query(collection(db, "interviews"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
      };
    });
  } catch (error) {
    console.error(`Firestore getSessionsByUserId Error (userId: ${userId}):`, error);
    return [];
  }
}

// ==========================================================
// 3. CUSTOM QUESTION OPERATIONS
// ==========================================================

export async function getCustomQuestions() {
  try {
    const snapshot = await getDocs(collection(db, "questions"));
    return snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id
    }));
  } catch (error) {
    console.error("Firestore getCustomQuestions Error:", error);
    return [];
  }
}

export async function saveCustomQuestion(id: string, question: any) {
  try {
    await setDoc(doc(db, "questions", id), question);
    return true;
  } catch (error) {
    console.error(`Firestore saveCustomQuestion Error (id: ${id}):`, error);
    throw error;
  }
}

export async function deleteCustomQuestion(id: string) {
  try {
    await deleteDoc(doc(db, "questions", id));
    return true;
  } catch (error) {
    console.error(`Firestore deleteCustomQuestion Error (id: ${id}):`, error);
    throw error;
  }
}

// ==========================================================
// 4. NOTIFICATION OPERATIONS
// ==========================================================

export async function getNotifications(userId: string) {
  try {
    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });
    // Sort in code because ordering queries in firestore requires composite indexes which might not be set up
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list;
  } catch (error) {
    console.error(`Firestore getNotifications Error (userId: ${userId}):`, error);
    return [];
  }
}

export async function addNotification(userId: string, notification: any) {
  try {
    const notifId = notification.id || `notif_${Date.now()}`;
    await setDoc(doc(db, "notifications", notifId), {
      ...notification,
      id: notifId,
      userId,
      isRead: notification.isRead || false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Firestore addNotification Error (userId: ${userId}):`, error);
    throw error;
  }
}

export async function deleteNotificationsForUser(userId: string) {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "notifications", d.id)));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error(`Firestore deleteNotificationsForUser Error (userId: ${userId}):`, error);
    throw error;
  }
}

// ==========================================================
// 5. TOKEN REVOCATION OPERATIONS
// ==========================================================

export async function revokeToken(token: string) {
  try {
    const tokenId = Buffer.from(token).toString("base64").substring(0, 100); // Create safe id
    await setDoc(doc(db, "revoked_tokens", tokenId), {
      token,
      revokedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Firestore revokeToken Error:", error);
    throw error;
  }
}

export async function isTokenRevoked(token: string) {
  try {
    const tokenId = Buffer.from(token).toString("base64").substring(0, 100);
    const tokenDoc = await getDoc(doc(db, "revoked_tokens", tokenId));
    return tokenDoc.exists();
  } catch (error) {
    console.error("Firestore isTokenRevoked Error:", error);
    return false;
  }
}

// ==========================================================
// 6. SYSTEM CONFIGURATION / CALIBRATION OPERATIONS
// ==========================================================

let cachedCalibration: any = null;
let cachedCalibrationTime: number = 0;
const CALIBRATION_CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory TTL cache

export async function getSystemCalibration() {
  const now = Date.now();
  if (cachedCalibration && (now - cachedCalibrationTime < CALIBRATION_CACHE_TTL_MS)) {
    return cachedCalibration;
  }
  try {
    const configDoc = await getDoc(doc(db, "system_config", "dr_banner_defaults"));
    if (configDoc.exists()) {
      cachedCalibration = configDoc.data();
      cachedCalibrationTime = now;
      return cachedCalibration;
    }
  } catch (error) {
    console.error("Firestore getSystemCalibration Error:", error);
  }
  return {
    modelName: "gemini-2.5-flash",
    atsWeight: 40,
    confidenceWeight: 30,
    communicationWeight: 30,
    features: {
      liveAudio: true,
      resumeAts: true,
      customQuestions: true,
      learningRoadmaps: true
    }
  };
}

export async function updateSystemCalibration(updates: any) {
  try {
    await setDoc(doc(db, "system_config", "dr_banner_defaults"), updates, { merge: true });
    // Invalidate the local cache
    cachedCalibration = null;
    cachedCalibrationTime = 0;
    return true;
  } catch (error) {
    console.error("Firestore updateSystemCalibration Error:", error);
    throw error;
  }
}

