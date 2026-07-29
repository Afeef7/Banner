import { Emotion, InterviewerResponse, InterviewState } from "../types";
import { auth } from "../lib/firebase";

export const generateInterviewerResponse = async (
  state: InterviewState,
  userMessage: string
): Promise<InterviewerResponse> => {
  try {
    // Get secure Firebase auth ID token to make authenticated API requests to backend
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/v1/ai/interviewer-response', {
      method: 'POST',
      headers,
      body: JSON.stringify({ state, userMessage })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return resData.data;
      }
    }
    
    throw new Error(`API response status: ${response.status}`);
  } catch (primaryError) {
    console.warn("Secure API response proxy failed or was unauthorized. Retrying with local intelligent rule-based fallback generator...", primaryError);
    return generateLocalFallbackResponse(state, userMessage);
  }
};

const generateLocalFallbackResponse = (state: InterviewState, userMessage: string): InterviewerResponse => {
  const currentSubStep = state.subStep || 1;
  const lowercaseMsg = userMessage.toLowerCase();
  
  const wordCount = userMessage.trim().split(/\s+/).length;
  const hasTechnicalKeywords = /react|javascript|typescript|python|java|sql|api|database|git|html|css|cpp|c\+\+|aws|docker|node|express|backend|frontend/.test(lowercaseMsg);
  const hasActionKeywords = /solve|manage|conflict|team|project|lead|deadline|bug|handle|resolve|work|create/.test(lowercaseMsg);

  let score = 7;
  let clarity = 75;
  let relevance = 70;
  let confidence = 70;
  let fillerWords = 3;

  if (wordCount > 30) {
    clarity += 10;
    relevance += 15;
    confidence += 10;
  }
  if (hasTechnicalKeywords) {
    score += 1;
    relevance += 10;
  }
  if (hasActionKeywords) {
    score += 1;
    confidence += 10;
  }
  if (lowercaseMsg.includes("uh") || lowercaseMsg.includes("um") || lowercaseMsg.includes("like")) {
    fillerWords += 4;
    clarity -= 10;
  }

  score = Math.min(10, Math.max(1, score));
  clarity = Math.min(100, Math.max(10, clarity));
  relevance = Math.min(100, Math.max(10, relevance));
  confidence = Math.min(100, Math.max(10, confidence));

  let strength = "You provided a direct, clear response to the prompt.";
  let improvement = "Incorporate more concrete examples from your past projects to back up your technical claims.";

  if (currentSubStep === 1) {
    strength = "Excellent introductory response highlighting your enthusiasm for the role.";
    improvement = "Include a brief outline of your key technological competencies and alignment with the team's needs.";
  } else if (hasTechnicalKeywords && wordCount > 25) {
    strength = "Strong demonstration of technical knowledge and domain vocabulary.";
    improvement = "Discuss the specific trade-offs and performance implications of the systems you mentioned.";
  } else if (hasActionKeywords) {
    strength = "Poised behavioral framing displaying proactive problem-solving and collaboration skills.";
    improvement = "Use the STAR method (Situation, Task, Action, Result) to give your situational answers more structure.";
  }

  let text = "";
  let emotion: Emotion = "smile";
  let nextStep: InterviewState['step'] | undefined = undefined;
  let finalAnalysis: InterviewerResponse['finalAnalysis'] = undefined;

  const roleStr = state.candidateInfo.targetRole || "Software Engineer";

  if (currentSubStep < 8) {
    const nextQNum = currentSubStep + 1;
    emotion = "nod";
    
    if (nextQNum === 2) {
      text = `Excellent! Now let's dive into core concepts. As an aspiring ${roleStr}, what are the fundamental concepts and principles you prioritize in your day-to-day work?`;
    } else if (nextQNum === 3) {
      text = `That makes a lot of sense. Can you explain how you stay up-to-date with current best practices and tools in the "${roleStr}" space?`;
    } else if (nextQNum === 4) {
      text = `Very interesting. Let's shift to collaboration. How do you handle disagreements or conflicting priorities when working on a tight-knit team?`;
    } else if (nextQNum === 5) {
      text = `Poised approach! How do you handle intense workloads, tight sprints, or constructive criticism from senior peers?`;
    } else if (nextQNum === 6) {
      text = `That is excellent advice. Now, let's talk about projects. What is a key project you led or built, what tech stack was selected, and what was the main technical hurdle you overcame?`;
    } else if (nextQNum === 7) {
      text = `That project sounds solid. Let's do a situational crisis question: If you discover a critical block or major failure right before release but fixing it would delay the sprint, what steps would you take?`;
    } else {
      text = `Excellent response. What is your long-term career goal as a ${roleStr}, and how do you see yourself contributing to our engineering or operations culture?`;
    }
  } else {
    text = `Thank you for sharing your structured approach! We have completed all 8 rounds. I am compiling your final placement readiness report now. Let's review the evaluation!`;
    emotion = "happy";
    nextStep = "result";
    
    finalAnalysis = {
      summary: `Outstanding effort completing your placement interview practice with Dr. Banner for the ${roleStr} position! You demonstrated strong technical capability and structured framing in your responses.`,
      technicalReview: `You explained key concepts with good fundamentals. To upgrade further, try integrating specific framework or architecture names into your answers to demonstrate deep, hands-on experience.`,
      communicationReview: `Your pacing was consistent, and you answered clearly. Aim to avoid starting sentences with fillers and structure answers using the STAR method (Situation, Task, Action, Result) for maximum impact.`,
      confidenceReview: `You responded directly with poise and conviction. Maintaining a steady flow and starting with clear, assertive direct answers will convey perfect workplace readiness.`,
      clarityReview: ` phrasings are structured and clear. Focus on simplifying complex topics first.`,
      relevanceReview: `Answers directly addressed the prompt with good relevance. Keep maintaining tight relevance in high-stress sessions.`,
      fillerWordsReview: `Fluency is excellent with very minimal filler words. Keep speaking deliberately to maintain this standard.`,
      careerFit: score >= 8 ? 'Highly Recommended for Placement' : 'Recommended with Upskilling Scope',
      suggestedRoles: [roleStr, 'Associate Practitioner']
    };
  }

  return {
    text,
    emotion,
    feedback: {
      strength,
      improvement,
      score,
      metrics: {
        confidence,
        technical: relevance, // backwards compatibility
        communication: clarity, // backwards compatibility
        clarity,
        relevance,
        fillerWords
      }
    },
    nextStep,
    finalAnalysis
  };
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/v1/ai/generate-speech', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data?.audio) {
        return resData.data.audio;
      }
    }
    throw new Error(`API response status: ${response.status}`);
  } catch (error) {
    console.warn("Primary TTS generation failed. Returning empty string to trigger browser Web Speech Synthesis fallback.", error);
    return '';
  }
};

export const generateAvatar = async (emotion: Emotion): Promise<string> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/v1/ai/generate-avatar', {
      method: 'POST',
      headers,
      body: JSON.stringify({ emotion })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data?.image) {
        return resData.data.image;
      }
    }
    throw new Error(`API response status: ${response.status}`);
  } catch (error) {
    console.warn("Avatar image generation is not available (likely API key permissions or network):", error);
    return '';
  }
};

export const generateCustomQuestionsAI = async (
  targetRole: string,
  topic: string,
  difficulty: 'Junior' | 'Mid' | 'Senior'
): Promise<Array<{
  question: string;
  category: string;
  expectedKeywords: string[];
}>> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/v1/ai/custom-questions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetRole, topic, difficulty })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        return resData.data;
      }
    }

    throw new Error(`API response status: ${response.status}`);
  } catch (error) {
    console.warn("AI question generation failed, using local rule-based generators:", error);
    // Return high-quality mock questions if the API call fails or lacks key
    return [
      {
        question: `Explain how you would approach designing and scaling a system based on ${topic} specifically for a complex ${targetRole} workflow.`,
        category: topic,
        expectedKeywords: ["scalability", "latency", "bottleneck", "architecture"]
      },
      {
        question: `What are the most common performance anti-patterns or trade-offs associated with ${topic} when building ${difficulty}-level projects?`,
        category: topic,
        expectedKeywords: ["performance", "trade-offs", "caching", "reliability"]
      },
      {
        question: `How do you handle security vulnerabilities, credentials management, or auditing when implementing ${topic} in production?`,
        category: topic,
        expectedKeywords: ["security", "encryption", "auditing", "access-control"]
      }
    ];
  }
};
