export type Emotion = 'smile' | 'thinking' | 'nod' | 'serious' | 'neutral' | 'greeting' | 'happy' | 'surprised' | 'concerned';

export interface InterviewState {
  step: 'intro' | 'personal_info' | 'hr' | 'technical' | 'project' | 'situational' | 'result';
  subStep: number;
  candidateInfo: {
    name?: string;
    department?: string;
    skills?: string;
    targetRole?: string;
  };
  history: {
    role: 'interviewer' | 'candidate';
    text: string;
    emotion?: Emotion;
    score?: number;
    feedback?: {
      strength: string;
      improvement: string;
      metrics?: {
        confidence: number;
        technical: number;
        communication: number;
        clarity?: number;
        relevance?: number;
        fillerWords?: number;
      };
    };
  }[];
  isFinished: boolean;
  liveMetrics?: {
    confidence: number;
    technical: number;
    communication: number;
    clarity?: number;
    relevance?: number;
    fillerWords?: number;
  };
  finalAnalysis?: {
    summary: string;
    technicalReview: string;
    communicationReview: string;
    confidenceReview: string;
    clarityReview?: string;
    relevanceReview?: string;
    fillerWordsReview?: string;
    careerFit: string;
    suggestedRoles: string[];
  };
}

export interface InterviewerResponse {
  text: string;
  emotion: Emotion;
  feedback?: {
    strength: string;
    improvement: string;
    score: number;
    metrics?: {
      confidence: number;
      technical: number;
      communication: number;
      clarity?: number;
      relevance?: number;
      fillerWords?: number;
    };
  };
  nextStep?: InterviewState['step'];
  finalAnalysis?: {
    summary: string;
    technicalReview: string;
    communicationReview: string;
    confidenceReview: string;
    clarityReview?: string;
    relevanceReview?: string;
    fillerWordsReview?: string;
    careerFit: string;
    suggestedRoles: string[];
  };
}

export interface ResumeData {
  score: number;
  fileName: string;
  roleAlignment: string;
  extractedSkills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    period: string;
  }[];
  projects: {
    title: string;
    description: string;
    tech: string[];
  }[];
  certifications: string[];
  recommendations: {
    category: 'formatting' | 'impact' | 'skills' | 'keywords';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  uploadedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'candidate';
  resume?: ResumeData;
}
