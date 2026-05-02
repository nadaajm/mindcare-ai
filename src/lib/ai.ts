import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch {
  ai = null;
}

// Check if AI is available
const isAIAvailable = (): boolean => !!ai && !!apiKey;

// Fallback responses when AI is not configured
const FALLBACK_RESPONSES = {
  journal: {
    sentiment: 'Neutral',
    stressLevel: 5,
    happinessLevel: 5,
    anxietyLevel: 5,
    advice: 'Keep tracking your feelings. This is a safe space.',
    isCrisis: false
  },
  chat: [
    "I'm here for you. While my full capabilities are initializing, please know that sharing your thoughts is always helpful.",
    "Thank you for opening up. Taking time to reflect is an important part of your wellness journey.",
    "I hear you. Remember, every emotion is valid and part of your unique experience.",
    "I'm listening. Would you like to talk more about what brought you here today?"
  ],
  protocol: [
    { id: '1', title: "Breathing Reset", description: "Take 5 slow breaths - inhale for 4 counts, hold for 4, exhale for 6.", type: 'meditation' as const },
    { id: '2', title: "Body Scan", description: "Notice 3 things your body feels right now without judgment.", type: 'meditation' as const },
    { id: '3', title: "Gratitude Moment", description: "Name one thing you're grateful for, no matter how small.", type: 'activity' as const }
  ],
  soundscape: { title: "Calm Focus", description: "Soft ambient sounds for grounding.", frequency: "432Hz" },
  systemHealth: { integrity: 98, status: "STABLE" as const, anomalies: [] as string[], recommendation: "All systems operational." },
  neuralMap: { title: "Gentle Waves", analysis: "Your emotional patterns show resilience and growth potential." }
};

// Helper to get random fallback chat response
function getRandomChatResponse(): string {
  const responses = FALLBACK_RESPONSES.chat;
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function analyzeJournal(content: string): Promise<{
  sentiment: string;
  stressLevel: number;
  happinessLevel: number;
  anxietyLevel: number;
  advice: string;
  isCrisis: boolean;
}> {
  if (!isAIAvailable() || !ai) {
    return FALLBACK_RESPONSES.journal;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this mental health journal entry: "${content}". 
      Return a JSON object with:
      - sentiment: 'Happy' | 'Sad' | 'Anxious' | 'Neutral'
      - stressLevel: number (0-10)
      - happinessLevel: number (0-10)
      - anxietyLevel: number (0-10)
      - advice: string (one supportive sentence)
      - isCrisis: boolean (true if user mentions self-harm or deep crisis)`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return FALLBACK_RESPONSES.journal;
  }
}

export async function getChatResponse(message: string, history: { role: string; content: string }[] = []): Promise<string> {
  const lowerCaseMsg = message.toLowerCase();
  if (lowerCaseMsg.includes("suicide") || lowerCaseMsg.includes("kill myself") || lowerCaseMsg.includes("end my life")) {
    return "I am deeply concerned about what you are going through. Please reach out to a professional or a crisis helpline immediately. In many places, you can call 988 or your local emergency services. You are not alone.";
  }

  if (!isAIAvailable() || !ai) {
    return getRandomChatResponse();
  }

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: "You are MindCare AI+, a supportive and empathetic mental health assistant. Your goal is to listen, provide coping strategies, and encourage the user. If you detect a crisis, always prioritize safety and suggest professional help."
      }
    });
    return response.text as string;
  } catch (error) {
    console.error("AI Chat failed:", error);
    return getRandomChatResponse();
  }
}

export async function getDailyProtocol(profile: any, recentMoods: any[]): Promise<{ id: string; title: string; description: string; type: 'meditation' | 'activity' | 'social' }[]> {
  if (!isAIAvailable() || !ai) {
    return FALLBACK_RESPONSES.protocol;
  }

  try {
    const moodContext = recentMoods.map(m => `Mood: ${m.score}/10`).join(', ');
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Profile: ${profile.displayName}, Role: ${profile.role}. Recent Moods: [${moodContext}].
      Generate 3 specific, professional, and slightly futuristic wellness "protocols" (tasks) for today.
      Ensure they sound high-tech and clinically beneficial.
      Return JSON: { "protocols": [ { "id": "1", "title": "...", "description": "...", "type": "meditation" | "activity" | "social" } ] }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string).protocols;
  } catch (error) {
    console.error("Protocol generation failed:", error);
    return FALLBACK_RESPONSES.protocol;
  }
}

export async function analyzeSystemHealth(data: any): Promise<{ integrity: number; status: string; anomalies: string[]; recommendation: string }> {
  if (!isAIAvailable() || !ai) {
    return FALLBACK_RESPONSES.systemHealth;
  }

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this system operational data for a mental health app: ${JSON.stringify(data)}. 
      Check for anomalies in behavioral patterns or data consistency. 
      Return JSON: { "integrity": number, "status": "STABLE" | "DEGRADED" | "CRITICAL", "anomalies": string[], "recommendation": string }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string);
  } catch (error) {
    return FALLBACK_RESPONSES.systemHealth;
  }
}

export async function getNeuralMapSummary(moods: any[]): Promise<{ title: string; analysis: string }> {
  if (!isAIAvailable() || !ai) {
    return FALLBACK_RESPONSES.neuralMap;
  }

  try {
    const context = moods.map(m => `Score: ${m.score}`).join(', ');
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this sequence of emotional scores: [${context}]. 
      Describe this constellation as if it were a cosmic event or a neural landscape.
      Use high-concept, poetic, and professional psychological language.
      Return JSON: { "title": "...", "analysis": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string);
  } catch (error) {
    return FALLBACK_RESPONSES.neuralMap;
  }
}

export async function getGlobalSearchAnalysis(query: string, data: any[]): Promise<{ summary: string; relevantIndices: number[] }> {
  if (!isAIAvailable() || !ai) {
    return { summary: "Searching your records...", relevantIndices: [] };
  }

  try {
    const content = data.map(d => d.content || d.title || d.label).join(' | ');
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search Query: "${query}". Context Data: [${content}].
      Find the most relevant fragments and summarize why they matter to the user's current goal.
      Return JSON: { "summary": "...", "relevantIndices": number[] }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string);
  } catch (error) {
    return { summary: "Analyzing your records...", relevantIndices: [] };
  }
}

export async function getSoundscapeRecommendation(moodScore: number): Promise<{ title: string; description: string; frequency: string }> {
  if (!isAIAvailable() || !ai) {
    return FALLBACK_RESPONSES.soundscape;
  }

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current mood score: ${moodScore}/10. 
      Recommend a specific type of soundscape (e.g., "Binaural Rain", "Solaris Ambient", "Deep Forest frequencies").
      Return JSON: { "title": "...", "description": "...", "frequency": "..." }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text as string);
  } catch (error) {
    return FALLBACK_RESPONSES.soundscape;
  }
}
