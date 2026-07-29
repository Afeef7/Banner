import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  Star, 
  Award, 
  GraduationCap, 
  Briefcase, 
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Database,
  Sparkles,
  Check,
  FileJson,
  FileCode,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Play,
  Volume2,
  VolumeX,
  ListTodo,
  Compass,
  UserCheck,
  Smile,
  CheckSquare,
  Square,
  Flame,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';

export interface ReportData {
  candidateName: string;
  department: string;
  targetRole: string;
  overallScore: number;
  history: any[];
  strengths?: string[];
  improvements?: string[];
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
  liveMetrics?: {
    confidence: number;
    technical: number;
    communication: number;
    clarity?: number;
    relevance?: number;
    fillerWords?: number;
  };
  timestamp?: any;
}

interface ReportViewerProps {
  data: ReportData;
  historyList?: any[];
  onBack?: () => void; // Provided when viewing a historical item
  onRestart?: () => void; // Provided when viewing the active session report
  hasSavedToDb?: boolean;
  onSaveToDb?: () => void;
  onViewHistoryItem?: (item: any) => void;
}

export default function ReportViewer({ 
  data, 
  historyList = [], 
  onBack, 
  onRestart, 
  hasSavedToDb = false, 
  onSaveToDb,
  onViewHistoryItem 
}: ReportViewerProps) {
  
  // Tab control: 'coach' (Overview & Roadmap), 'replay' (Transcript & Audio), 'history' (Past Sessions comparison)
  const [activeTab, setActiveTab] = useState<'coach' | 'replay' | 'history'>('coach');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  
  // State for interactive roadmap
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const finalConfidence = data.liveMetrics?.confidence || 
    (data.history.filter(h => h.feedback?.metrics).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.confidence || 0), 0) / data.history.filter(h => h.feedback?.metrics).length) 
      : 85);

  const finalTechnical = data.liveMetrics?.technical || 
    (data.history.filter(h => h.feedback?.metrics).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.technical || 0), 0) / data.history.filter(h => h.feedback?.metrics).length) 
      : 75);

  const finalCommunication = data.liveMetrics?.communication || 
    (data.history.filter(h => h.feedback?.metrics).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.communication || 0), 0) / data.history.filter(h => h.feedback?.metrics).length) 
      : 80);

  const finalClarity = data.liveMetrics?.clarity || 
    (data.history.filter(h => h.feedback?.metrics?.clarity !== undefined).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics?.clarity !== undefined).reduce((sum, h) => sum + (h.feedback?.metrics?.clarity || 0), 0) / data.history.filter(h => h.feedback?.metrics?.clarity !== undefined).length) 
      : finalCommunication);

  const finalRelevance = data.liveMetrics?.relevance || 
    (data.history.filter(h => h.feedback?.metrics?.relevance !== undefined).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics?.relevance !== undefined).reduce((sum, h) => sum + (h.feedback?.metrics?.relevance || 0), 0) / data.history.filter(h => h.feedback?.metrics?.relevance !== undefined).length) 
      : finalTechnical);

  const finalFillerWords = data.liveMetrics?.fillerWords || 
    (data.history.filter(h => h.feedback?.metrics?.fillerWords !== undefined).length > 0 
      ? Math.round(data.history.filter(h => h.feedback?.metrics?.fillerWords !== undefined).reduce((sum, h) => sum + (h.feedback?.metrics?.fillerWords || 0), 0) / data.history.filter(h => h.feedback?.metrics?.fillerWords !== undefined).length) 
      : 85);

  const overallPercent = data.overallScore || Math.round((finalConfidence + finalRelevance + finalClarity) / 3);

  const finalReport = data.finalAnalysis || {
    summary: `Outstanding effort completing your placement interview practice with Dr. Banner! You demonstrated strong capability and structural framing in your responses.`,
    technicalReview: `You explained key concepts with good fundamentals. To upgrade further, try integrating specific framework or architecture names into your answers to demonstrate deep, hands-on experience.`,
    communicationReview: `Your pacing was consistent, and you answered clearly. Aim to avoid starting sentences with fillers and structure answers using the STAR method (Situation, Task, Action, Result) for maximum impact.`,
    confidenceReview: `You responded directly with poise and conviction. Maintaining a steady flow and starting with clear, assertive direct answers will convey perfect workplace readiness.`,
    careerFit: overallPercent >= 85 ? 'Highly Recommended for Placement' : 'Recommended with Upskilling Scope',
    suggestedRoles: data.targetRole ? [data.targetRole, 'Software Developer'] : ['Software Engineer', 'Associate Developer', 'Full Stack Practitioner']
  };

  // Find previous session in history for trend analysis
  const getPreviousSession = () => {
    if (!historyList || historyList.length <= 1) return null;
    
    // Sort history by timestamp descending
    const sorted = [...historyList].sort((a, b) => {
      const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
      const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });

    // Find the item right after the current one or simply the second one in history if current is first
    const currentTimestamp = data.timestamp?.seconds ? data.timestamp.seconds * 1000 : new Date().getTime();
    
    const prev = sorted.find(h => {
      const hTime = h.timestamp?.seconds ? h.timestamp.seconds * 1000 : new Date(h.timestamp || 0).getTime();
      return hTime < (currentTimestamp - 5000); // 5 seconds margin to avoid matching current
    });

    return prev || sorted[1] || null;
  };

  const prevSession = getPreviousSession();
  const scoreDiff = prevSession ? (overallPercent - (prevSession.overallScore || 0)) : 0;

  // Convert Firebase serverTimestamp or JS Date
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Speech Synthesis replay capability
  const handlePlayAudio = (id: string, text: string) => {
    if (!synth) return;
    
    if (playingMessageId === id) {
      synth.cancel();
      setPlayingMessageId(null);
      return;
    }

    synth.cancel();
    const cleanText = text.replace(/[*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setPlayingMessageId(null);
    };
    
    utterance.onerror = () => {
      setPlayingMessageId(null);
    };

    setPlayingMessageId(id);
    synth.speak(utterance);
  };

  // Determine primary development category to tailor learning roadmap
  const getWeakestCategory = () => {
    const min = Math.min(finalConfidence, finalTechnical, finalCommunication);
    if (min === finalTechnical) return 'technical';
    if (min === finalCommunication) return 'communication';
    return 'confidence';
  };

  const weakestCategory = getWeakestCategory();

  // Generate Personalized AI Coaching 30-Day Learning Roadmap
  const getRoadmapSteps = () => {
    const baseRoles = data.targetRole || 'Software Professional';
    
    if (weakestCategory === 'technical') {
      return [
        {
          id: 't1',
          week: 'Week 1',
          title: 'Deepen Core Conceptual Foundations',
          desc: `Review the essential architecture blocks for ${baseRoles}. Focus specifically on theoretical tradeoffs, performance optimizations, and scaling limitations of resources you described.`,
          duration: 'Day 1 - 7',
          tips: 'Action: Document 3 core concepts in your target tech stack. Explain each in under 2 minutes without using fluff words.'
        },
        {
          id: 't2',
          week: 'Week 2',
          title: 'Concrete Project Integration Drill',
          desc: 'Analyze your past project descriptions. Upgrade them with highly specific industry frameworks, database patterns, and deployment strategies rather than using generalized development terms.',
          duration: 'Day 8 - 14',
          tips: 'Action: Use standard architectural diagrams. Memorize exact names of design patterns (e.g., Singleton, CQRS, Event-Driven) you have utilized.'
        },
        {
          id: 't3',
          week: 'Week 3',
          title: 'STAR Technical Explanation Framework',
          desc: 'Format technical achievements through the STAR method. Describe the Situation, the exact Task, the Actions you took, and the quantifiable technical Result (e.g., 30% reduction in database load).',
          duration: 'Day 15 - 21',
          tips: 'Action: Practice writing 3 STAR stories highlighting technical complexity, then practice speaking them in front of a mirror.'
        },
        {
          id: 't4',
          week: 'Week 4',
          title: 'Full Stack Integration Assessment',
          desc: 'Run a placement simulation with Dr. Banner focusing strictly on core architectural questions. Maintain deep system engineering narratives and precise terminology.',
          duration: 'Day 22 - 30',
          tips: 'Action: Focus on depth. If you do not know an answer, clearly explain your debugging procedure and cognitive approach rather than guessing.'
        }
      ];
    } else if (weakestCategory === 'communication') {
      return [
        {
          id: 'c1',
          week: 'Week 1',
          title: 'Master STAR Structuring & Framing',
          desc: 'Avoid rambling. Force every behavioral and experience answer into a strict STAR (Situation, Task, Action, Result) grid. Set a mental timer for 45 seconds per section.',
          duration: 'Day 1 - 7',
          tips: 'Action: Write down answers to standard behavioral prompts and label each paragraph explicitly as Situation, Task, Action, or Result.'
        },
        {
          id: 'c2',
          week: 'Week 2',
          title: 'Filler Word Elimination Sprint',
          desc: 'Consciously reduce crutch filler words ("like", "basically", "you know", "actually"). Practice using deliberate silence and structural pauses to transition thoughts instead.',
          duration: 'Day 8 - 14',
          tips: 'Action: Record yourself explaining a random topic for 2 minutes. Count every filler word. Aim to bring the count under 3.'
        },
        {
          id: 'c3',
          week: 'Week 3',
          title: 'Direct Strategic Hook (First 15 Seconds)',
          desc: 'Establish your answer immediately in the first sentence. Do not build up with prefaces. Start with: "My experience with X is centered on..." or "An instance where I led this was..."',
          duration: 'Day 15 - 21',
          tips: 'Action: Focus on immediate clarity. Answer the core of the question instantly, then expand on the situational details.'
        },
        {
          id: 'c4',
          week: 'Week 4',
          title: 'Mock Simulation under Communication Constraints',
          desc: 'Practice a simulated high-stakes placement round. Focus purely on consistent delivery pacing, strong voice modulation, and clear professional word selections.',
          duration: 'Day 22 - 30',
          tips: 'Action: Check your speech rate. The ideal professional interview pace is around 130 - 150 words per minute.'
        }
      ];
    } else {
      // Confidence lowest
      return [
        {
          id: 'p1',
          week: 'Week 1',
          title: 'Vocal Presence & Direct Anchoring',
          desc: 'Build strong vocal foundations. Practice breathing deeply from the diaphragm before answering to stabilize pitch. Speak with assertive, direct downward inflections.',
          duration: 'Day 1 - 7',
          tips: 'Action: Avoid trailing off or ending sentences in a rising pitch (upspeaking), which indicates uncertainty. End on a firm, confident tone.'
        },
        {
          id: 'p2',
          week: 'Week 2',
          title: 'Positive Cognitive Reframing Drill',
          desc: 'Replace apologetic vocabulary ("I only", "I just", "I think", "I guess") with assertive professional vocabulary ("I directed", "I optimized", "My strategy was").',
          duration: 'Day 8 - 14',
          tips: 'Action: Rewrite a recent resume bullet point or answer to remove all qualifying or defensive language. Assert your project ownership.'
        },
        {
          id: 'p3',
          week: 'Week 3',
          title: 'Stress-Inducing Mock Practice',
          desc: 'Simulate high-pressure scenarios where you are asked unexpected or extremely difficult questions. Practice holding composure, smiling slightly, and pacing yourself.',
          duration: 'Day 15 - 21',
          tips: 'Action: When hit with a hard question, practice pausing deliberately for 3 seconds before responding. Composure is extremely premium.'
        },
        {
          id: 'p4',
          week: 'Week 4',
          title: 'Final Composure & Placement Alignment',
          desc: 'Engage in a complete 8-round simulation with Dr. Banner. Focus on professional posture, active hand gestures (if on video), and speaking with immediate conviction.',
          duration: 'Day 22 - 30',
          tips: 'Action: Focus entirely on the coach'
        }
      ];
    }
  };

  const roadmapSteps = getRoadmapSteps();

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // PDF Download Handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 20;
    const pageHeight = 280;
    const margin = 20;
    const contentWidth = 170;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight) {
        doc.addPage();
        y = margin;
      }
    };

    // Draw header accent line (Sleek professional purple)
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1.5);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    // Header Title
    doc.setTextColor(17, 24, 39); // Clean near-black
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DR. BANNER AI CAREER COACH ASSESSMENT", margin, y);
    y += 8;

    // Subtitle / Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // modern gray
    const dateStr = formatTimestamp(data.timestamp);
    doc.text(`Candidate: ${data.candidateName || 'Anonymous'}  |  Date: ${dateStr}`, margin, y);
    y += 6;
    doc.text(`Department Focus: ${data.department || 'N/A'}  |  Target Role: ${data.targetRole || 'N/A'}`, margin, y);
    y += 10;

    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    // SECTION 1: COACH SUMMARY & VERDICT
    checkPageBreak(45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text("1. Professional Coach Overview & Placement Verdict", margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`Overall Placement Readiness Score: ${overallPercent}%  (${finalReport.careerFit})`, margin, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const summaryLines = doc.splitTextToSize(finalReport.summary, contentWidth);
    checkPageBreak(summaryLines.length * 5 + 5);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 5) + 12;

    // SECTION 2: EVALUATION DIMENSIONS
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text("2. Key Placement Competencies", margin, y);
    y += 8;

    // Technical
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`Technical Depth & Domain Competency: ${finalTechnical}%`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const techLines = doc.splitTextToSize(finalReport.technicalReview, contentWidth);
    checkPageBreak(techLines.length * 5 + 10);
    doc.text(techLines, margin, y);
    y += (techLines.length * 5) + 8;

    // Communication
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`Communication & STAR Framing: ${finalCommunication}%`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const commLines = doc.splitTextToSize(finalReport.communicationReview, contentWidth);
    checkPageBreak(commLines.length * 5 + 10);
    doc.text(commLines, margin, y);
    y += (commLines.length * 5) + 8;

    // Confidence
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`Confidence, Pacing & Composure: ${finalConfidence}%`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const confLines = doc.splitTextToSize(finalReport.confidenceReview, contentWidth);
    checkPageBreak(confLines.length * 5 + 10);
    doc.text(confLines, margin, y);
    y += (confLines.length * 5) + 12;

    // SECTION 3: STRENGTHS & OPPORTUNITIES
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text("3. Core Strengths & Key Coaching Insights", margin, y);
    y += 8;

    // Strengths
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text("Strengths Demonstrated:", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const strengths = data.history.filter(h => h.feedback?.strength).slice(-3).map(h => h.feedback?.strength);
    if (strengths.length > 0) {
      strengths.forEach(str => {
        const lines = doc.splitTextToSize(`• ${str}`, contentWidth);
        checkPageBreak(lines.length * 5 + 5);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 2;
      });
    } else {
      doc.text("Consistent execution of responses.", margin, y);
      y += 6;
    }
    y += 4;

    // Opportunities
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246); // blue
    doc.text("Coaching Opportunities to Upgrade:", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const improvements = data.history.filter(h => h.feedback?.improvement).slice(-3).map(h => h.feedback?.improvement);
    if (improvements.length > 0) {
      improvements.forEach(imp => {
        const lines = doc.splitTextToSize(`• ${imp}`, contentWidth);
        checkPageBreak(lines.length * 5 + 5);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 2;
      });
    } else {
      doc.text("Refine answer structure for high pressure questions.", margin, y);
      y += 6;
    }
    y += 12;

    // SECTION 4: ROADMAP
    checkPageBreak(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text("4. Personalized 30-Day Coaching & Upskilling Roadmap", margin, y);
    y += 8;

    roadmapSteps.forEach((step, i) => {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(`${step.week}: ${step.title} (${step.duration})`, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const descLines = doc.splitTextToSize(step.desc, contentWidth);
      doc.text(descLines, margin, y);
      y += (descLines.length * 5) + 4;
    });

    // Save PDF
    const filename = `Dr_Banner_Coach_Report_${data.candidateName?.replace(/\s+/g, "_") || "Candidate"}.pdf`;
    doc.save(filename);
  };

  // HTML Download Handler (Single file offline professional dashboard)
  const handleDownloadHTML = () => {
    const dateStr = formatTimestamp(data.timestamp);
    const roundsHtml = data.history.filter(h => h.role === 'interviewer' && h.feedback).map((msg, i) => {
      const candidateMsg = data.history[data.history.indexOf(msg) - 1];
      return `
        <div class="round-card">
          <div class="round-header">
            <span class="round-title">Round ${i + 1} Question</span>
            <span class="round-score">Rating: ${msg.score || 0}/10</span>
          </div>
          <p class="question-text">"${msg.text}"</p>
          ${candidateMsg ? `
            <div class="answer-box">
              <p class="answer-text"><strong>Your Verbal Response:</strong> ${candidateMsg.text}</p>
              <div class="feedback-grid">
                <div>
                  <span class="feedback-label label-strength">Core Strength</span>
                  <p class="feedback-desc">${msg.feedback?.strength || 'N/A'}</p>
                </div>
                <div>
                  <span class="feedback-label label-improvement">Coach Opportunity for Upgrade</span>
                  <p class="feedback-desc">${msg.feedback?.improvement || 'N/A'}</p>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const roadmapHtml = roadmapSteps.map(step => `
      <div class="roadmap-card">
        <div class="roadmap-week">${step.week} &bull; ${step.duration}</div>
        <div class="roadmap-title">${step.title}</div>
        <p class="roadmap-desc">${step.desc}</p>
        <div class="roadmap-tips"><strong>Coaching Action:</strong> ${step.tips}</div>
      </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Coaching Portfolio - ${data.candidateName || 'Candidate'}</title>
  <style>
    body {
      background-color: #050505;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 16px;
      line-height: 1.6;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: #0c0c0e;
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 32px;
      padding: 48px;
      box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
      position: relative;
    }
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, #8b5cf6, #10b981, #3b82f6);
      border-top-left-radius: 32px;
      border-top-right-radius: 32px;
    }
    header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 32px;
      margin-bottom: 40px;
    }
    h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      margin: 8px 0 0 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #a78bfa;
    }
    .g-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      margin-bottom: 40px;
    }
    @media (min-width: 768px) {
      .g-grid {
        grid-template-columns: 1fr 2fr;
      }
    }
    .card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 20px;
      padding: 32px;
    }
    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 8px solid rgba(139, 92, 246, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      background: rgba(139, 92, 246, 0.02);
    }
    .score-value {
      font-size: 38px;
      font-weight: 900;
      color: #fff;
    }
    .score-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
    }
    .competency-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    @media (min-width: 480px) {
      .competency-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .comp-card {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 20px;
    }
    .comp-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 4px;
    }
    .comp-score {
      font-size: 20px;
      font-weight: 900;
      color: #fff;
    }
    .comp-desc {
      font-size: 11px;
      opacity: 0.7;
      margin: 12px 0;
      line-height: 1.5;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #8b5cf6;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 12px;
      margin-bottom: 24px;
      font-weight: 800;
    }
    .round-card {
      border-left: 2px solid rgba(139, 92, 246, 0.2);
      padding-left: 20px;
      margin-bottom: 32px;
    }
    .round-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .round-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #a78bfa;
    }
    .round-score {
      font-size: 11px;
      font-weight: bold;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px 12px;
      border-radius: 8px;
    }
    .question-text {
      font-size: 13px;
      font-style: italic;
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 16px 0;
    }
    .answer-box {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      padding: 20px;
    }
    .answer-text {
      font-size: 13px;
      margin: 0 0 16px 0;
    }
    .feedback-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      padding-top: 16px;
    }
    @media (min-width: 480px) {
      .feedback-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .feedback-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }
    .label-strength { color: #10b981; }
    .label-improvement { color: #3b82f6; }
    .feedback-desc {
      font-size: 12px;
      margin: 0;
      opacity: 0.8;
    }
    .roadmap-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    @media (min-width: 640px) {
      .roadmap-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .roadmap-card {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 24px;
    }
    .roadmap-week {
      font-size: 10px;
      font-weight: 800;
      color: #8b5cf6;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .roadmap-title {
      font-size: 15px;
      font-weight: bold;
      color: #fff;
      margin: 6px 0 12px 0;
    }
    .roadmap-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 16px 0;
    }
    .roadmap-tips {
      font-size: 11px;
      background: rgba(139, 92, 246, 0.05);
      padding: 10px 14px;
      border-radius: 8px;
      color: #c084fc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="accent-bar"></div>
    <header>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1>AI Career Coaching Profile: <span style="color: #a78bfa;">${data.candidateName || 'Candidate'}</span></h1>
          <p class="subtitle">Dr. Banner Personal Placement Assessment System &bull; ${dateStr}</p>
        </div>
        <div class="badge">${finalReport.careerFit}</div>
      </div>
    </header>

    <div class="g-grid">
      <div class="card" style="text-align: center;">
        <div class="score-circle">
          <span class="score-value">${overallPercent}%</span>
          <span class="score-label">Placement Score</span>
        </div>
        <div class="badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #34d399;">
          ${finalReport.careerFit}
        </div>
        <p style="font-size: 12px; opacity: 0.5; margin: 20px 0 0 0;">
          Target Role: ${data.targetRole || 'N/A'}<br>Focus Focus: ${data.department || 'N/A'}
        </p>
      </div>

      <div class="card">
        <div class="section-title">Coaching Narrative Overview</div>
        <p style="font-size: 13px; line-height: 1.7; opacity: 0.9; margin: 0;">${finalReport.summary}</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: 40px;">
      <div class="section-title">Competency Pillars</div>
      <div class="competency-grid">
        <div class="comp-card">
          <div class="comp-title" style="color: #fbbf24;">Confidence</div>
          <div class="comp-score">${finalConfidence}%</div>
          <p class="comp-desc">${finalReport.confidenceReview}</p>
        </div>
        <div class="comp-card">
          <div class="comp-title" style="color: #60a5fa;">Technical</div>
          <div class="comp-score">${finalTechnical}%</div>
          <p class="comp-desc">${finalReport.technicalReview}</p>
        </div>
        <div class="comp-card">
          <div class="comp-title" style="color: #34d399;">Communication</div>
          <div class="comp-score">${finalCommunication}%</div>
          <p class="comp-desc">${finalReport.communicationReview}</p>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 40px;">
      <div class="section-title">Personalized 30-Day Coach Roadmap</div>
      <div class="roadmap-grid">
        ${roadmapHtml}
      </div>
    </div>

    <div class="card">
      <div class="section-title">Verbal Replay Transcript & Commentary</div>
      <div style="margin-top: 24px;">
        ${roundsHtml || '<p style="opacity: 0.5; font-style: italic; font-size: 12px;">No rounds logged.</p>'}
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dr_Banner_AI_Coaching_Portfolio_${data.candidateName?.replace(/\s+/g, "_") || "Candidate"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dr_Banner_Evaluation_${data.candidateName?.replace(/\s+/g, "_") || "Report"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#09090b] border border-white/5 rounded-3xl p-5 md:p-8 relative overflow-hidden shadow-2xl max-w-6xl mx-auto font-sans text-white/90"
    >
      {/* Decorative Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Save to Cloud Database Prompt Banner */}
      {!hasSavedToDb && onSaveToDb && (
        <div className="relative z-10 mb-6 p-4 rounded-2xl bg-zinc-900 border border-violet-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 shadow-inner">
              <Sparkles className="text-violet-400" size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-2">
                Persist Coaching Profile to Dashboard
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  Save Result
                </span>
              </h4>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Log this assessment to your placement history and compile your trend analysis score.
              </p>
            </div>
          </div>
          <button
            onClick={onSaveToDb}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 active:scale-98 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer"
          >
            <Database size={13} />
            Save Profile to Cloud
          </button>
        </div>
      )}

      {hasSavedToDb && onSaveToDb && (
        <div className="relative z-10 mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Check className="text-emerald-400" size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-400">Successfully Logged to Dashboard</h4>
            <p className="text-[10px] text-white/40">This placement assessment has been stored. You can track your trends below.</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.04] pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 text-white/60 hover:text-white transition-all mr-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
              AI Coaching Portfolio
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Assessment Report: <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-white">{data.candidateName || 'Candidate'}</span>
          </h1>
          
          <div className="text-xs text-white/40 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="bg-zinc-900 px-2 py-0.5 rounded text-white/60 text-[10px]">Area: {data.department || 'N/A'}</span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded text-white/60 text-[10px]">Role: {data.targetRole || 'N/A'}</span>
            {data.timestamp && (
              <span className="flex items-center gap-1 text-violet-300 text-[10px]">
                <Calendar size={11} />
                {formatTimestamp(data.timestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Exports & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download PDF Coach Report"
          >
            <FileText size={12} className="text-red-400" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button 
            onClick={handleDownloadHTML}
            className="px-3 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 text-xs font-bold rounded-xl border border-violet-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download single-file offline interactive dashboard"
          >
            <FileCode size={12} className="text-violet-400" />
            <span className="hidden sm:inline">Offline Dashboard</span>
            <span className="sm:hidden">HTML</span>
          </button>
          <button 
            onClick={handleDownloadJSON}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download JSON structured data"
          >
            <FileJson size={12} className="text-yellow-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          {onRestart && (
            <button 
              onClick={onRestart}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/10 cursor-pointer"
            >
              <span>Practice Again</span>
              <RefreshCw size={11} className="animate-spin-slow" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector: Redesigned as clean, minimalist tabs */}
      <div className="relative z-10 flex border-b border-white/[0.04] mb-6 gap-6">
        <button
          onClick={() => setActiveTab('coach')}
          className={cn(
            "pb-3 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'coach' ? "text-violet-400" : "text-white/40 hover:text-white"
          )}
        >
          <Compass size={13} />
          AI Coaching Roadmap
          {activeTab === 'coach' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('replay')}
          className={cn(
            "pb-3 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'replay' ? "text-violet-400" : "text-white/40 hover:text-white"
          )}
        >
          <Play size={13} />
          Interactive Replay Room
          {activeTab === 'replay' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-3 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'history' ? "text-violet-400" : "text-white/40 hover:text-white"
          )}
        >
          <TrendingUp size={13} />
          Progress & History
          {activeTab === 'history' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'coach' && (
            <motion.div
              key="coach-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Top Overview Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Score Widget */}
                <div className="lg:col-span-4 bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black opacity-40 mb-3">Placement Readiness</span>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center mb-3">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="58" 
                        stroke="rgba(255, 255, 255, 0.03)" 
                        strokeWidth="8" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="58" 
                        stroke="url(#gradientScoreViewer)" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray="364.4"
                        strokeDashoffset={364.4 - (364.4 * overallPercent) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradientScoreViewer" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">{overallPercent}%</span>
                      <span className="text-[8px] uppercase tracking-wider opacity-30">Matching Rate</span>
                    </div>
                  </div>

                  <span className={cn(
                    "px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border text-center mt-1",
                    overallPercent >= 80 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                  )}>
                    {finalReport.careerFit}
                  </span>
                </div>

                {/* AI Coach Welcoming & Overview */}
                <div className="lg:col-span-8 bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smile size={16} className="text-violet-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Dr. Banner's Assessment</span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Personalized Coaching Brief</h2>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {finalReport.summary}
                    </p>
                  </div>

                  {/* Score improvement helper if exists */}
                  {prevSession && (
                    <div className="mt-4 p-3 bg-violet-600/5 border border-violet-500/10 rounded-xl flex items-center gap-3">
                      <TrendingUp size={16} className="text-violet-400 shrink-0" />
                      <p className="text-[11px] text-violet-300">
                        {scoreDiff > 0 ? (
                          <span>Progress Trend: You've made an impressive <strong>+{scoreDiff}%</strong> improvement compared to your previous attempt!</span>
                        ) : scoreDiff < 0 ? (
                          <span>Strategic focus: Your matching rate was slightly lower this turn. Let's use the roadmap below to rebuild key concepts.</span>
                        ) : (
                          <span>Performance consistency: You've matched your high-composure baseline perfectly. Excellent work maintaining standard.</span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {!prevSession && (
                    <div className="mt-4 p-3 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-2">
                      <Flame size={14} className="text-orange-400 shrink-0" />
                      <p className="text-[11px] text-white/50">
                        Baseline Session Set: Practice more and Dr. Banner will track your placement progress metrics dynamically.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Competency Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Technical Pillar */}
                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={15} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Technical Depth</span>
                      </div>
                      <span className="text-sm font-black text-white">{finalTechnical}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/60">
                      {finalReport.technicalReview}
                    </p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${finalTechnical}%` }} />
                  </div>
                </div>

                {/* Communication Pillar */}
                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase size={15} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Communication Structure</span>
                      </div>
                      <span className="text-sm font-black text-white">{finalCommunication}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/60">
                      {finalReport.communicationReview}
                    </p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${finalCommunication}%` }} />
                  </div>
                </div>

                {/* Confidence Pillar */}
                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award size={15} className="text-yellow-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-yellow-500">Confidence & Pacing</span>
                      </div>
                      <span className="text-sm font-black text-white">{finalConfidence}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/60">
                      {finalReport.confidenceReview}
                    </p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${finalConfidence}%` }} />
                  </div>
                </div>

              </div>

              {/* Strengths and Improvements - Clear professional side-by-side coaching cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Core Strengths Demonstrated
                  </h3>
                  <ul className="space-y-3">
                    {data.history.filter(h => h.feedback?.strength).slice(-3).map((h, i) => (
                      <li key={i} className="text-xs flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="text-white/80 leading-relaxed mt-0.5">{h.feedback?.strength}</span>
                      </li>
                    ))}
                    {data.history.filter(h => h.feedback?.strength).length === 0 && (
                      <li className="text-xs text-white/40 italic">Outstanding execution across conversational milestones.</li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    Strategic Upgrade Opportunities
                  </h3>
                  <ul className="space-y-3">
                    {data.history.filter(h => h.feedback?.improvement).slice(-3).map((h, i) => (
                      <li key={i} className="text-xs flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          !
                        </div>
                        <span className="text-white/80 leading-relaxed mt-0.5">{h.feedback?.improvement}</span>
                      </li>
                    ))}
                    {data.history.filter(h => h.feedback?.improvement).length === 0 && (
                      <li className="text-xs text-white/40 italic">Refining structured alignment is recommended.</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* Redesigned Personalized 30-Day Learning Roadmap with Interactive Checkboxes */}
              <div className="bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ListTodo size={15} className="text-violet-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Personalized AI Learning Track</span>
                    </div>
                    <h2 className="text-base font-bold text-white tracking-tight">Your 30-Day Placement Roadmap</h2>
                    <p className="text-xs text-white/40">Tailored plan addressing your most immediate development dimension: <strong className="text-violet-300 uppercase font-mono text-[10px]">{weakestCategory}</strong></p>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="bg-zinc-900 border border-white/5 px-3 py-1.5 rounded-xl text-right">
                    <div className="text-[9px] uppercase tracking-wider text-white/40">Roadmap Progress</div>
                    <div className="text-xs font-bold text-violet-400">
                      {Object.values(completedSteps).filter(Boolean).length} of {roadmapSteps.length} Milestones Complete
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmapSteps.map((step) => {
                    const isDone = !!completedSteps[step.id];
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => toggleStep(step.id)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer select-none space-y-3 relative group",
                          isDone 
                            ? "bg-violet-950/10 border-violet-500/30 shadow-inner" 
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-400">
                              {step.week} &bull; {step.duration}
                            </span>
                            <h3 className={cn("text-sm font-bold tracking-tight text-white", isDone && "line-through opacity-50")}>
                              {step.title}
                            </h3>
                          </div>
                          
                          <button className="text-white/40 group-hover:text-violet-400 transition-colors shrink-0">
                            {isDone ? (
                              <CheckSquare size={18} className="text-violet-400 fill-violet-400/15" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </div>

                        <p className={cn("text-xs text-white/60 leading-relaxed", isDone && "opacity-30")}>
                          {step.desc}
                        </p>

                        <div className={cn(
                          "p-2.5 rounded bg-zinc-950/50 border border-white/5 text-[10px] text-white/50 leading-relaxed",
                          isDone && "opacity-30"
                        )}>
                          <span className="font-bold text-violet-300">Coach Guidance:</span> {step.tips}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'replay' && (
            <motion.div
              key="replay-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="p-4 bg-zinc-950 border border-white/[0.04] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Volume2 size={13} className="text-violet-400 animate-pulse" />
                    Interview Audio Replay Studio
                  </h3>
                  <p className="text-[11px] text-white/40">Listen back to transcripts, vocal pacing, and Dr. Banner's coaching commentary.</p>
                </div>
                
                <span className="text-[10px] bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-full text-white/50">
                  {data.history.filter(h => h.role === 'interviewer' && h.feedback).length} Rounds Logged
                </span>
              </div>

              {/* Conversations List */}
              <div className="space-y-6 max-w-4xl mx-auto">
                {data.history.filter(h => h.role === 'interviewer' && h.feedback).map((msg, i) => {
                  const candidateMsg = data.history[data.history.indexOf(msg) - 1];
                  const qId = `q-${i}`;
                  const aId = `a-${i}`;

                  return (
                    <div key={i} className="space-y-3 p-5 bg-zinc-950/60 border border-white/[0.03] rounded-2xl relative">
                      
                      {/* Round Identifier */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">Round {i + 1} Assessment</span>
                        <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[10px] text-white/70">
                          <Star size={10} className="fill-yellow-500 text-yellow-500 mr-0.5" />
                          <span>Score: {msg.score || 0}/10</span>
                        </div>
                      </div>

                      {/* Coach Question Bubble */}
                      <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-[10px] font-black text-violet-400 shrink-0 mt-0.5">
                          DB
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-violet-300">Dr. Banner (Question)</span>
                            <button 
                              onClick={() => handlePlayAudio(qId, msg.text)}
                              className="text-white/40 hover:text-white p-1 rounded transition-colors"
                              title="Listen to question"
                            >
                              {playingMessageId === qId ? <VolumeX size={12} className="text-violet-400 animate-bounce" /> : <Volume2 size={12} />}
                            </button>
                          </div>
                          <p className="text-xs italic text-white/50 leading-relaxed">
                            "{msg.text}"
                          </p>
                        </div>
                      </div>

                      {/* Candidate Response Bubble */}
                      {candidateMsg && (
                        <div className="flex gap-3 items-start pt-3 border-t border-white/[0.03]">
                          <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/60 shrink-0 mt-0.5">
                            ME
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-400">Your Answer Transcript</span>
                              <button 
                                onClick={() => handlePlayAudio(aId, candidateMsg.text)}
                                className="text-white/40 hover:text-white p-1 rounded transition-colors"
                                title="Listen to response"
                              >
                                {playingMessageId === aId ? <VolumeX size={12} className="text-emerald-400 animate-bounce" /> : <Volume2 size={12} />}
                              </button>
                            </div>
                            
                            <p className="text-xs text-white/80 leading-relaxed bg-white/[0.01] border border-white/[0.02] p-3 rounded-xl">
                              {candidateMsg.text}
                            </p>

                            {/* Commentary Panel */}
                            <div className="p-3.5 bg-zinc-900 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                              <div className="space-y-1">
                                <span className="font-bold text-emerald-400 uppercase tracking-wide text-[9px] block">Strength</span>
                                <p className="text-white/70 leading-relaxed">{msg.feedback?.strength}</p>
                              </div>
                              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                                <span className="font-bold text-blue-400 uppercase tracking-wide text-[9px] block">Opportunity</span>
                                <p className="text-white/70 leading-relaxed">{msg.feedback?.improvement}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}

                {data.history.filter(h => h.role === 'interviewer' && h.feedback).length === 0 && (
                  <div className="text-center py-12 bg-zinc-950 border border-white/[0.04] rounded-2xl text-white/40 text-xs italic">
                    No transcript entries logged in this report context.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Trend Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Baseline Target</span>
                  <div className="text-2xl font-black text-white">{data.targetRole || 'Professional'}</div>
                  <p className="text-[11px] text-white/40">Placement readiness score baseline compared over {historyList.length} total logged sessions.</p>
                </div>

                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Attempts</span>
                  <div className="text-2xl font-black text-white flex items-center gap-2">
                    {historyList.length} <span className="text-xs font-normal text-white/40">Practices logged</span>
                  </div>
                  <p className="text-[11px] text-white/40">Consistent practice is the highest indicator of ultimate placement success.</p>
                </div>

                <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Score Differential</span>
                  <div className="text-2xl font-black text-white flex items-center gap-1.5">
                    {prevSession ? (
                      <>
                        <span>{scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}</span>
                        <span className="text-xs font-normal text-white/40">since last try</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-white/40">Baseline Session</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40">Track the developmental progression of strategic answers over time.</p>
                </div>

              </div>

              {/* History Switcher Panel */}
              <div className="bg-zinc-950 border border-white/[0.04] p-6 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar size={13} className="text-violet-400" />
                    Placement History Logs
                  </h3>
                  <p className="text-[11px] text-white/40">Select and load past interview records instantly to compare side-by-side or inspect historic recommendations.</p>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {historyList.map((item, idx) => {
                    const isCurrent = item.timestamp?.seconds === data.timestamp?.seconds || (item.overallScore === data.overallScore && item.targetRole === data.targetRole);
                    return (
                      <div 
                        key={idx}
                        onClick={() => onViewHistoryItem && onViewHistoryItem(item)}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                          isCurrent 
                            ? "bg-violet-950/10 border-violet-500/30" 
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold shrink-0",
                            isCurrent 
                              ? "bg-violet-500/10 border-violet-500/20 text-violet-400" 
                              : "bg-zinc-900 border-white/5 text-white/50"
                          )}>
                            {item.overallScore || 75}%
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {item.targetRole || 'Software Professional'}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-violet-600/20 text-violet-300 rounded border border-violet-500/20">
                                  Viewing
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40">
                              {item.department || 'N/A'} &bull; {formatTimestamp(item.timestamp)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/50 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                            {item.history ? item.history.filter((h: any) => h.role === 'interviewer' && h.feedback).length : 0} rounds
                          </span>
                          <ChevronRight size={14} className="text-white/30" />
                        </div>
                      </div>
                    );
                  })}

                  {historyList.length === 0 && (
                    <p className="text-center py-6 text-xs text-white/40 italic">
                      Save your current evaluation to establish your dynamic database history log.
                    </p>
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
