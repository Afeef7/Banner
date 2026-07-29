import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { Modality, LiveServerMessage, Type } from "@google/genai";
import { getGeminiClient } from "./server/services/gemini";
import dotenv from "dotenv";
import { apiRouter } from "./server/routes/api";
import { authRouter } from "./server/routes/auth";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Custom Cookie Parser Middleware to populate req.cookies for JWT HTTPOnly session tracking
app.use((req, res, next) => {
  const cookies: { [key: string]: string } = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = (parts[0] || '').trim();
      const val = (parts[1] || '').trim();
      if (key) {
        cookies[key] = val;
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// Mount the new production-ready modular REST API Router (Services Layer)
app.use("/api/v1", apiRouter);
app.use("/api/v1/auth", authRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = 3000;

// Initialize GoogleGenAI securely via the dedicated service
const ai = getGeminiClient();

// Upgrade HTTP requests to WebSocket
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/live-ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Setup WebSocket connections
wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Client connected to Live Interview WS");
  let liveSession: any = null;

  try {
    // Connect to Gemini Live API
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Fenrir" } // Fenrir matches Dr. Banner's deep warm voice
          }
        },
        systemInstruction: `You are Dr. Banner, a friendly and highly professional virtual interviewer conducting a collegiate placement interview in real-time.
        Your goal is to converse naturally and professionally. Keep questions concise and focused (1-2 sentences). 
        Conduct a realistic interview round step-by-step:
        1. Ask for their name, department/major, and target career role.
        2. Ask a soft skills behavioral question (e.g., resolving team conflict).
        3. Ask a core technical question matching their target department or role.
        4. Ask about a technical project they built.
        5. Ask a situational workplace crisis question.
        6. Conclude the interview warmly.`,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          // Send model's voice audio chunk to the client
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }

          // Send transcription/text chunk to the client for live subtitles
          const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (text) {
            clientWs.send(JSON.stringify({ text }));
          }

          // Handle turn completion
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }

          // Handle user interruption
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          clientWs.close();
        },
        onerror: (err) => {
          console.error("Gemini Live error:", err);
          clientWs.send(JSON.stringify({ error: err.message || "Gemini Live Error" }));
        }
      }
    });

    console.log("Connected to Gemini Live successfully");
    clientWs.send(JSON.stringify({ status: "connected" }));

  } catch (error: any) {
    console.error("Failed to establish Gemini Live connection:", error);
    clientWs.send(JSON.stringify({ error: "Failed to connect to Gemini Live API. Please check your API key." }));
    clientWs.close();
    return;
  }

  // Handle incoming messages from client
  clientWs.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      if (data.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: "audio/pcm;rate=16000"
          }
        });
      }
    } catch (err) {
      console.error("Error processing client WS message:", err);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected from Live Interview WS");
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {}
    }
  });
});

// AI Resume Intelligence Analyzer Endpoint
app.post("/api/resume/analyze", async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText || typeof resumeText !== "string") {
    res.status(400).json({ error: "Missing resume text for analysis" });
    return;
  }

  try {
    const prompt = `Analyze this resume text and extract its core structured details. Make sure you score the resume out of 100 on ATS alignment. 
    Detail their education, projects, professional experience, certifications, and skills accurately based on the content.
    Provide constructive, high-value, actionable career coaching recommendations in the "recommendations" list.

    Resume Text:
    """
    ${resumeText}
    """`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "ATS quality score from 0 to 100 based on formatting, action verbs, and skill density" 
            },
            roleAlignment: { 
              type: Type.STRING, 
              description: "Best matching professional role or title target" 
            },
            extractedSkills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of matched core technical or professional skills"
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  period: { type: Type.STRING },
                  highlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core bullet achievements" }
                },
                required: ["role", "company", "period", "highlights"]
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  school: { type: Type.STRING },
                  period: { type: Type.STRING }
                },
                required: ["degree", "school", "period"]
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tech: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "description", "tech"]
              }
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Must be 'formatting', 'impact', 'skills', or 'keywords'" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "high, medium, or low" }
                },
                required: ["category", "title", "description", "priority"]
              }
            }
          },
          required: [
            "score", 
            "roleAlignment", 
            "extractedSkills", 
            "experience", 
            "education", 
            "projects", 
            "certifications", 
            "recommendations"
          ]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Failed to analyze resume with Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to analyze resume" });
  }
});

// Serve assets with Vite in development, or serve built files in production
(async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and WebSocket server running on http://0.0.0.0:${PORT}`);
  });
})();
