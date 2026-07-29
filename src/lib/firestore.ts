import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

enum OperationType {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface InterviewRecord {
  candidateName: string;
  department: string;
  targetRole: string;
  overallScore: number;
  history: any[];
  strengths: string[];
  improvements: string[];
  userId: string;
  timestamp: any;
  finalAnalysis?: {
    summary: string;
    technicalReview: string;
    communicationReview: string;
    confidenceReview: string;
    careerFit: string;
    suggestedRoles: string[];
  };
  liveMetrics?: {
    confidence: number;
    technical: number;
    communication: number;
  };
}

export const saveInterviewResult = async (data: Omit<InterviewRecord, 'userId' | 'timestamp'>, overrideUserId?: string) => {
  const currentUserId = auth.currentUser?.uid || overrideUserId;
  if (!currentUserId) return;

  const path = 'interviews';
  try {
    await addDoc(collection(db, path), {
      ...data,
      userId: currentUserId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getInterviewHistory = async (overrideUserId?: string) => {
  const currentUserId = auth.currentUser?.uid || overrideUserId;
  
  if (!currentUserId) return [];

  const path = 'interviews';
  try {
    const isRealAdmin = auth.currentUser && auth.currentUser.email === 'jhonkiladi@gmail.com';
    const isDemoAdmin = !auth.currentUser && currentUserId === 'demo-admin-123';

    if (isRealAdmin) {
      const q = query(
        collection(db, path),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (isDemoAdmin) {
      const q1 = query(
        collection(db, path),
        where('userId', '==', 'demo-candidate-123'),
        orderBy('timestamp', 'desc')
      );
      const q2 = query(
        collection(db, path),
        where('userId', '==', 'demo-admin-123'),
        orderBy('timestamp', 'desc')
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const docs = [
        ...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      docs.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      return docs;
    } else {
      const q = query(
        collection(db, path),
        where('userId', '==', currentUserId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }
  return null;
};

export const syncUserProfile = async (user: any, role?: 'admin' | 'candidate') => {
  if (!user) return;
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const determinedRole = role || (user.email === 'jhonkiladi@gmail.com' ? 'admin' : 'candidate');

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: determinedRole,
        createdAt: serverTimestamp(),
      });
    } else {
      // update role if explicitly passed, not set yet, or is the core administrator email
      const existingData = userDoc.data();
      if (role || !existingData.role || user.email === 'jhonkiladi@gmail.com') {
        await setDoc(userRef, { role: role || determinedRole }, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const recordLoginActivity = async (user: any) => {
  if (!user) return;
  const path = 'login_activities';
  try {
    const userAgent = navigator.userAgent || 'Unknown';
    // We can also make a quick request or look at window.location, but keeping it robust and simple:
    await addDoc(collection(db, path), {
      userId: user.uid,
      email: user.email,
      timestamp: serverTimestamp(),
      userAgent: userAgent,
      ip: '127.0.0.1'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getLoginActivities = async (overrideUserId?: string) => {
  const currentUserId = auth.currentUser?.uid || overrideUserId;

  if (!currentUserId) return [];
  const path = 'login_activities';
  try {
    const isRealAdmin = auth.currentUser && auth.currentUser.email === 'jhonkiladi@gmail.com';
    const isDemoAdmin = !auth.currentUser && currentUserId === 'demo-admin-123';

    if (isRealAdmin) {
      const q = query(
        collection(db, path),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (isDemoAdmin) {
      const q1 = query(
        collection(db, path),
        where('userId', '==', 'demo-candidate-123'),
        orderBy('timestamp', 'desc')
      );
      const q2 = query(
        collection(db, path),
        where('userId', '==', 'demo-admin-123'),
        orderBy('timestamp', 'desc')
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const docs = [
        ...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      docs.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      return docs;
    } else {
      const q = query(
        collection(db, path),
        where('userId', '==', currentUserId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// ===============================================================
// Enterprise Admin Operations
// ===============================================================

export interface AdminUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'candidate';
  createdAt?: any;
  resume?: any;
  deleted?: boolean;
}

export interface CustomQuestion {
  id: string;
  question: string;
  category: string;
  targetRole: string;
  difficulty: 'Junior' | 'Mid' | 'Senior';
  expectedKeywords: string[];
}

export interface SystemConfig {
  modelName: string;
  temperature: number;
  systemPrompt: string;
  voiceGender: 'male' | 'female' | 'neural';
  voiceSpeed: number;
  voicePitch: number;
  activeFeatures: {
    liveTranslation: boolean;
    voiceModulation: boolean;
    realTimeSTARRating: boolean;
    proctoredWebcamCheck: boolean;
  };
}

// Default base question bank for fallback / demo pre-population
export const DEFAULT_QUESTIONS: CustomQuestion[] = [
  {
    id: "q_1",
    question: "Explain the difference between optimistic and pessimistic locking in databases and when you would use each.",
    category: "Databases",
    targetRole: "Software Engineer",
    difficulty: "Mid",
    expectedKeywords: ["locking", "concurrency", "versioning", "write conflict", "transaction"]
  },
  {
    id: "q_2",
    question: "How does the virtual DOM in React improve rendering performance, and what are its overheads?",
    category: "Frontend",
    targetRole: "Software Engineer",
    difficulty: "Junior",
    expectedKeywords: ["virtual dom", "diffing", "reconciliation", "rendering", "fiber"]
  },
  {
    id: "q_3",
    question: "Describe how you would design a rate-limiting system for a highly available public REST API.",
    category: "System Architecture",
    targetRole: "Software Engineer",
    difficulty: "Senior",
    expectedKeywords: ["token bucket", "leaky bucket", "redis", "middleware", "scalability", "ddos"]
  },
  {
    id: "q_4",
    question: "What are the core metrics you look at when diagnosing a memory leak in a Node.js web server?",
    category: "Backend",
    targetRole: "Software Engineer",
    difficulty: "Senior",
    expectedKeywords: ["heap dump", "garbage collection", "memory leak", "chrome devtools", "profiling"]
  },
  {
    id: "q_5",
    question: "How do you handle feature selection and handle missing values in a messy business tabular dataset?",
    category: "Data Science",
    targetRole: "Data Analyst",
    difficulty: "Mid",
    expectedKeywords: ["imputation", "mean/median fill", "correlation matrix", "feature engineering", "pandas"]
  },
  {
    id: "q_6",
    question: "What is your approach to structuring a STAR framework response for a behavior question about team conflict?",
    category: "Behavioral",
    targetRole: "Product Manager",
    difficulty: "Mid",
    expectedKeywords: ["situation", "task", "action", "result", "resolution", "empathy"]
  }
];

// Default fallback system config
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  modelName: "gemini-3.5-flash",
  temperature: 0.4,
  systemPrompt: "You are Dr. Banner, an elite, high-precision corporate placement interviewer representing Google. Conduct a realistic technical, architectural, and behavioral STAR evaluation. Act with supreme operational professionalism. Probe deeply into technical metrics and design choices.",
  voiceGender: "male",
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  activeFeatures: {
    liveTranslation: false,
    voiceModulation: true,
    realTimeSTARRating: true,
    proctoredWebcamCheck: false
  }
};

// Fetch all registered user profiles
export const getAllUserProfiles = async (): Promise<AdminUserProfile[]> => {
  const path = 'users';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const list = qSnapshot.docs.map(d => ({ uid: d.id, ...d.data() })) as AdminUserProfile[];
    const activeList = list.filter(u => !u.deleted);
    if (activeList.length === 0) {
      throw new Error("No users found; fallback to mock profiles");
    }
    return activeList;
  } catch (error) {
    console.log("Reading users collection, providing demo/mock user data: ", error);
    // Return high-quality, rich candidates list for admin review
    return [
      {
        uid: "demo-candidate-123",
        email: "candidate@drbanner.ai",
        displayName: "Jhon Candidate",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100",
        role: "candidate",
        createdAt: { seconds: 1782297600, nanoseconds: 0 },
        resume: {
          score: 88,
          fileName: "jhon_software_engineer_2026.pdf",
          roleAlignment: "Software Engineer",
          extractedSkills: ["React", "TypeScript", "Node.js", "Express", "Docker", "AWS", "SQL", "Git"],
          experience: [
            {
              role: "Frontend Team Lead",
              company: "Aether Technologies",
              period: "2024 - Present",
              highlights: [
                "Led design and migration of user dashboard system to React 18 & Vite, reducing bundle loads by 45%.",
                "Orchestrated cross-functional collaboration sprints utilizing Agile/Scrum structures."
              ]
            }
          ],
          education: [{ degree: "B.S. Computer Science", school: "State University", period: "2020 - 2024" }],
          projects: [{ title: "AI Placement Dashboard", description: "Interactive full-stack performance dashboard.", tech: ["React", "Firebase", "Gemini"] }],
          certifications: ["AWS Certified Cloud Practitioner"],
          recommendations: [
            { category: "skills", title: "Add Kubernetes Context", description: "Your Docker context is strong, but adding orchestrations expands role alignment.", priority: "high" }
          ],
          uploadedAt: new Date().toISOString()
        }
      },
      {
        uid: "demo-analyst-456",
        email: "sarah.analytics@drbanner.ai",
        displayName: "Sarah Jenkins",
        photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100",
        role: "candidate",
        createdAt: { seconds: 1782124800, nanoseconds: 0 },
        resume: {
          score: 94,
          fileName: "sarah_data_analyst_senior.txt",
          roleAlignment: "Data Analyst",
          extractedSkills: ["Python", "SQL", "Pandas", "Tableau", "Excel", "Numpy", "PowerBI"],
          experience: [
            {
              role: "Senior Performance Analyst",
              company: "Stripe Metrics Group",
              period: "2023 - Present",
              highlights: [
                "Authored SQL metrics querying layers covering more than 2.4M transactions daily.",
                "Engineered Tableau analytics pipelines for product marketing divisions."
              ]
            }
          ],
          education: [{ degree: "M.S. Applied Statistics", school: "Ivy Tech", period: "2021 - 2023" }],
          projects: [{ title: "Churn Predictor ML", description: "Built custom Pandas logistic classifier achieving 92% precision.", tech: ["Python", "Pandas", "Scikit-Learn"] }],
          certifications: ["Google Data Analytics Professional"],
          recommendations: [
            { category: "impact", title: "Use Quantitative Verbs", description: "Frame performance metrics using explicit quantitative percentages rather than descriptive phrases.", priority: "medium" }
          ],
          uploadedAt: new Date().toISOString()
        }
      },
      {
        uid: "demo-admin-123",
        email: "jhonkiladi@gmail.com",
        displayName: "Jhon Lead Admin",
        photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100",
        role: "admin",
        createdAt: { seconds: 1782038400, nanoseconds: 0 }
      }
    ];
  }
};

// Update a user profile's role
export const updateUserProfileRole = async (userId: string, role: 'admin' | 'candidate'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role }, { merge: true });
  } catch (error) {
    console.error(`Failed to update user ${userId} role:`, error);
    throw error;
  }
};

// Delete a user profile (Admin only)
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { deleted: true }, { merge: true }); // Soft delete
  } catch (error) {
    console.error(`Failed to delete user profile ${userId}:`, error);
    throw error;
  }
};

// Custom AI Question Bank management
export const getCustomQuestions = async (): Promise<CustomQuestion[]> => {
  const path = 'questions';
  try {
    const qSnapshot = await getDocs(collection(db, path));
    const list = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as CustomQuestion[];
    const activeList = list.filter((q: any) => !q.deleted);
    if (activeList.length === 0) {
      return DEFAULT_QUESTIONS;
    }
    return activeList;
  } catch (error) {
    console.log("Reading custom questions collection, using fallback default set:", error);
    return DEFAULT_QUESTIONS;
  }
};

export const saveCustomQuestion = async (question: CustomQuestion): Promise<void> => {
  try {
    const docRef = doc(db, 'questions', question.id);
    await setDoc(docRef, question);
  } catch (error) {
    console.error("Failed to save custom question to Firestore:", error);
    throw error;
  }
};

export const deleteCustomQuestion = async (questionId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'questions', questionId);
    await setDoc(docRef, { deleted: true }, { merge: true }); // Soft delete
  } catch (error) {
    console.error("Failed to delete question from Firestore:", error);
    throw error;
  }
};

// Dynamic system settings / configurations
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const configDoc = await getDoc(doc(db, 'system_config', 'dr_banner_defaults'));
    if (configDoc.exists()) {
      return configDoc.data() as SystemConfig;
    }
    return DEFAULT_SYSTEM_CONFIG;
  } catch (error) {
    console.log("Reading system config, returning default options:", error);
    return DEFAULT_SYSTEM_CONFIG;
  }
};

export const saveSystemConfig = async (config: SystemConfig): Promise<void> => {
  try {
    const docRef = doc(db, 'system_config', 'dr_banner_defaults');
    await setDoc(docRef, config);
  } catch (error) {
    console.error("Failed to save system config to Firestore:", error);
    throw error;
  }
};

