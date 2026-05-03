import { GoogleGenerativeAI } from "@google/generative-ai";

type GoogleGenAI = InstanceType<typeof GoogleGenerativeAI>;

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDSwuryXVwmeWCKU3WZFHKJ70KSRpoxLnw';
let ai: GoogleGenAI | null = null;

  try {
    if (apiKey) {
      ai = new GoogleGenerativeAI({ apiKey });
    }
  } catch {
    ai = null;
  }

// Check if AI is available
export const isAIAvailable = (): boolean => !!ai && !!apiKey;

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
    "Thank you for sharing that. How does it make you feel when this happens?",
    "That's important. Can you tell me more about what you're experiencing?",
    "I understand. What would help you feel more grounded right now?",
    "You're doing great reaching out. What's the main thing on your mind?",
    "This sounds challenging. Would you like suggestions for managing this feeling?",
    "I'm with you. Let's take a moment to breathe and reflect together.",
    "Your awareness of this feeling is a positive step. What's your next move?",
    "That's valid. How long have you been feeling this way?",
    "Thank you for trusting me with this. What support do you need?",
    "Let's explore this together. What thoughts are coming up for you?"
  ],
  happyTips: [
    "Savor this positive moment! Try to mindfully notice what's contributing to your good mood.",
    "Consider sharing your joy with someone else - spreading positivity can amplify your own happiness.",
    "This is a great time to engage in activities that usually energize you.",
    "Try keeping a brief note of what's working well right now for future reference during tougher times.",
    "Your positive state is valuable - consider what you can learn about what brings you joy."
  ],
  sadTips: [
    "It's okay to feel sad sometimes. Allow yourself to experience these emotions without judgment.",
    "Consider small, gentle activities that usually bring you even slight comfort.",
    "Reaching out to someone you trust can help, even if it's just to say you're having a tough time.",
    "Try expressing your feelings through writing, art, or movement if talking feels difficult.",
    "Be patient with yourself - healing and emotional processing take time."
  ],
  anxiousTips: [
    "When anxiety feels overwhelming, try grounding techniques like focusing on your breath or surroundings.",
    "Challenge anxious thoughts by asking: 'What evidence do I have for and against this worry?'",
    "Consider scheduling a 'worry time' later in the day to contain anxious thinking.",
    "Physical activity, even gentle stretching, can help reduce anxiety symptoms.",
    "Remember that anxiety often peaks and then subsides like a wave - this feeling will pass."
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

// Helper to get intelligent fallback chat response based on message content
function getIntelligentChatResponse(msg: string): string {
  if (!msg || typeof msg !== 'string') {
    return "I'm here to listen. Could you share what's on your mind?";
  }

  const lowerMsg = msg.toLowerCase();
  
  // Crisis keywords - already handled in getChatResponse, but keeping for completeness
  if (lowerMsg.includes("suicide") || lowerMsg.includes("kill myself") || lowerMsg.includes("end my life")) {
    return "I am deeply concerned about what you are going through. Please reach out to a professional or a crisis helpline immediately. In many places, you can call 988 or your local emergency services. You are not alone.";
  }
  
  // Emotion and mental health keywords
  const emotionKeywords = {
    happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'good', 'well', 'pleased', 'content', 'grateful', 'thankful'],
    sad: ['sad', 'unhappy', 'depressed', 'miserable', 'down', 'blue', 'hurt', 'pain', 'cry', 'tears', 'grief', 'sorrow'],
    anxious: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'fear', 'afraid', 'overwhelmed', 'tense', 'stress', 'scared'],
    angry: ['angry', 'mad', 'furious', 'irritated', 'frustrated', 'annoyed', 'rage', 'outraged'],
    tired: ['tired', 'exhausted', 'fatigued', 'drained', 'sleepy', 'weary'],
    lonely: ['lonely', 'alone', 'isolated', 'abandoned', 'unloved'],
    hopeful: ['hopeful', 'optimistic', 'positive', 'encouraged', 'inspired'],
    confused: ['confused', 'lost', 'uncertain', 'unsure', 'puzzled', 'bewildered']
  };
  
  // Count matches for each emotion
  const emotionCounts: Record<string, number> = {};
  Object.keys(emotionKeywords).forEach(emotion => {
    emotionCounts[emotion] = emotionKeywords[emotion].filter(keyword => lowerMsg.includes(keyword)).length;
  });
  
  // Find the dominant emotion
  let dominantEmotion = null;
  let maxCount = 0;
  
  Object.keys(emotionCounts).forEach(emotion => {
    if (emotionCounts[emotion] > maxCount) {
      maxCount = emotionCounts[emotion];
      dominantEmotion = emotion;
    }
  });
  
  // If no clear emotion detected, use general responses
  if (maxCount === 0) {
    const generalResponses = [
      "Thank you for sharing that. How does it make you feel when this happens?",
      "That's important. Can you tell me more about what you're experiencing?",
      "I understand. What would help you feel more grounded right now?",
      "You're doing great reaching out. What's the main thing on your mind?",
      "This sounds challenging. Would you like suggestions for managing this feeling?",
      "I'm with you. Let's take a moment to breathe and reflect together.",
      "Your awareness of this feeling is a positive step. What's your next move?",
      "That's valid. How long have you been feeling this way?",
      "Thank you for trusting me with this. What support do you need?",
      "Let's explore this together. What thoughts are coming up for you?"
    ];
    const index = Math.floor(Math.random() * generalResponses.length);
    return generalResponses[index];
  }
  
  // Provide emotion-specific responses
  const emotionResponses: Record<string, string[]> = {
    happy: [
      "That's wonderful to hear! What's been contributing to your positive mood lately?",
      "I'm glad you're feeling good! What's been bringing you joy recently?",
      "It's beautiful to see you in a positive state. What's been working well for you?",
      "Your happiness is contagious! What positive experiences have you had recently?",
      "Feeling happy is a gift. What are you most grateful for right now?",
      "It's great to hear you're in a good place! What's been helping you maintain this positivity?",
      "Your positive energy is inspiring! What's been bringing you light lately?",
      "Feeling joyful is wonderful. What's been making you smile recently?",
      "It's awesome to see you feeling good! What positive changes have you noticed?",
      "Your happiness matters. What's been nurturing your sense of well-being?"
    ],
    sad: [
      "I hear that you're feeling sad, and that's okay. It's important to honor these feelings.",
      "Thank you for sharing your sadness with me. Would you like to talk about what's weighing on you?",
      "It takes courage to acknowledge sadness. What support do you need right now?",
      "I'm here with you in this difficult feeling. What would feel most comforting to you right now?",
      "Sadness is a valid emotion. What small act of kindness could you offer yourself today?",
      "Thank you for trusting me with your sadness. What's been making you feel this way?",
      "It's okay to not be okay. What gentle activity might help ease this sadness a little?",
      "I hear the heaviness in your words. What support system do you have available?",
      "Your feelings matter. What would help you feel a little more held right now?",
      "Thank you for sharing your truth. What small step could you take toward feeling better?"
    ],
    anxious: [
      "I can sense the anxiety in your words. What's been triggering these worried feelings?",
      "Thank you for sharing your anxiety. What grounding techniques usually help you feel more centered?",
      "Anxiety can be overwhelming. What's one small thing you could do right now to feel safer?",
      "I hear how stressed you're feeling. What would help calm your nervous system right now?",
      "Thank you for trusting me with your worries. What's the worst that could happen, and how would you cope?",
      "It takes strength to acknowledge anxiety. What coping strategies have helped you before?",
      "I'm here with you in this anxious moment. What would feel most soothing right now?",
      "Thank you for sharing your concerns. What's one thing you can control in this situation?",
      "Anxiety often tries to protect us. What is it trying to warn you about?",
      "Your feelings are valid. What self-compassion could you offer yourself right now?"
    ],
    angry: [
      "I can feel the intensity of your emotions. What's been fueling this anger?",
      "Thank you for sharing your anger with me. What boundary might need to be honored here?",
      "Anger often signals that something important needs attention. What is it trying to tell you?",
      "It takes courage to acknowledge anger. What healthy way could you express this emotion?",
      "Thank you for trusting me with your intensity. What would help you feel more peaceful right now?",
      "I hear the passion in your words. What positive action could this energy fuel?",
      "Your anger is valid. What need of yours might not be getting met?",
      "Thank you for sharing your truth. What forgiveness—toward others or yourself—might be helpful?",
      "It's okay to feel angry. What physical activity might help release this energy safely?",
      "I'm here with you in this strong emotion. What support do you need to process this?"
    ],
    tired: [
      "I hear the exhaustion in your words. What kind of rest do you need most right now?",
      "Thank you for sharing your fatigue. What small act of self-care could honor your tiredness?",
      "It's okay to be tired. What permission do you need to give yourself to rest?",
      "Thank you for trusting me with your exhaustion. What would help you feel more replenished?",
      "Your body is telling you something important. What is it asking for?",
      "I hear how drained you're feeling. What boundary might help protect your energy?",
      "Thank you for sharing your truth. What small restorative practice could help right now?",
      "It takes wisdom to acknowledge fatigue. What would help you recharge your batteries?",
      "Your tiredness is valid. What nourishment—physical, emotional, or spiritual—do you need?",
      "I'm here with you in this weary moment. What gentle support would feel most helpful?"
    ],
    lonely: [
      "I hear the loneliness in your words, and I want you to know you're not truly alone.",
      "Thank you for sharing your feelings of isolation. What connection are you longing for most?",
      "Loneliness can be painful. What small step could you take toward feeling more connected?",
      "Thank you for trusting me with your vulnerability. What would help you feel more seen right now?",
      "I'm here with you in this lonely moment. What kind of companionship are you needing?",
      "Your feelings of isolation are valid. What outreach could feel manageable right now?",
      "Thank you for sharing your truth. What self-connection could help ease this loneliness?",
      "It takes courage to admit loneliness. What social connection feels safe to explore?",
      "I hear the ache for connection. What small gesture could help bridge this distance?",
      "Your longing for connection matters. What community or relationship could nurture you?"
    ],
    hopeful: [
      "It's beautiful to hear the hope in your words! What's been inspiring this optimism?",
      "Thank you for sharing your hopeful spirit. What dreams or aspirations are you nurturing?",
      "Hope is a powerful force. What steps are you taking toward your hoped-for future?",
      "I'm inspired by your optimism. What positive possibilities are you envisioning?",
      "Thank you for trusting me with your hope. What's been feeding your sense of possibility?",
      "Your hopefulness is contagious! What vision are you holding for your life?",
      "It's wonderful to see you feeling encouraged. What progress have you already made?",
      "Thank you for sharing your positive outlook. What's been helping you maintain this hope?",
      "Hope lights the way forward. What small action aligns with your hopeful vision?",
      "I'm here to witness your hope. What aspiration feels most alive in your heart right now?"
    ],
    confused: [
      "Thank you for sharing your confusion. It's okay to not have all the answers right now.",
      "I hear the uncertainty in your words. What would help you feel more clear or grounded?",
      "It takes courage to admit confusion. What small step could help bring some clarity?",
      "Thank you for trusting me with your uncertainty. What information or support do you need?",
      "I'm here with you in this puzzled state. What perspective might be missing?",
      "Your confusion is valid. What question feels most important to explore right now?",
      "Thank you for sharing your truth. What would help you feel more oriented or centered?",
      "It's okay to feel lost sometimes. What guidance or wisdom could help you find your way?",
      "I hear your search for understanding. What resource or conversation might help?",
      "Your honest sharing creates space for clarity to emerge. What insight feels closest to the surface?"
    ]
  };
  
  // Get responses for the dominant emotion, or fall back to general
  const responses = emotionResponses[dominantEmotion] || [
    "Thank you for sharing that. How does it make you feel when this happens?",
    "That's important. Can you tell me more about what you're experiencing?",
    "I understand. What would help you feel more grounded right now?",
    "You're doing great reaching out. What's the main thing on your mind?",
    "This sounds challenging. Would you like suggestions for managing this feeling?",
    "I'm with you. Let's take a moment to breathe and reflect together.",
    "Your awareness of this feeling is a positive step. What's your next move?",
    "That's valid. How long have you been feeling this way?",
    "Thank you for trusting me with this. What support do you need?",
    "Let's explore this together. What thoughts are coming up for you?"
  ];
  
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
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
    // Fallback analysis when AI is not configured
    const lowerContent = content.toLowerCase();
    
    // Simple sentiment detection based on keywords
    const happyWords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'good', 'well', 'pleased', 'content'];
    const sadWords = ['sad', 'unhappy', 'depressed', 'miserable', 'down', 'blue', 'unhappy', 'hurt', 'pain', 'cry'];
    const anxiousWords = ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'fear', 'afraid', 'overwhelmed', 'tense', 'stress'];
    
    let sentiment = 'Neutral';
    let happinessLevel = 5;
    let sadnessLevel = 5; // temporary variable
    let anxietyLevel = 5;
    
    const happyCount = happyWords.filter(word => lowerContent.includes(word)).length;
    const sadCount = sadWords.filter(word => lowerContent.includes(word)).length;
    const anxiousCount = anxiousWords.filter(word => lowerContent.includes(word)).length;
    
    if (happyCount > sadCount && happyCount > anxiousCount) {
      sentiment = 'Happy';
      happinessLevel = Math.min(8 + happyCount, 10);
      sadnessLevel = Math.max(3 - happyCount, 0);
      anxietyLevel = Math.max(3 - happyCount, 0);
    } else if (sadCount > happyCount && sadCount > anxiousCount) {
      sentiment = 'Sad';
      happinessLevel = Math.max(3 - sadCount, 0);
      sadnessLevel = Math.min(8 + sadCount, 10);
      anxietyLevel = Math.max(3 - sadCount, 0);
    } else if (anxiousCount > happyCount && anxiousCount > sadCount) {
      sentiment = 'Anxious';
      happinessLevel = Math.max(3 - anxiousCount, 0);
      sadnessLevel = Math.max(3 - anxiousCount, 0);
      anxietyLevel = Math.min(8 + anxiousCount, 10);
    }
    
    // Return appropriate advice based on detected sentiment
    let advice = FALLBACK_RESPONSES.journal.advice; // default
    if (sentiment === 'Happy') {
      advice = getHappyTips();
    } else if (sentiment === 'Sad') {
      advice = getSadTips();
    } else if (sentiment === 'Anxious') {
      advice = getAnxiousTips();
    }
    
    return {
      sentiment: sentiment as 'Happy' | 'Sad' | 'Anxious' | 'Neutral',
      stressLevel: Math.max(3 - (happyCount > 0 ? happyCount : 0), 1), // inverse of happiness for stress
      happinessLevel: Math.min(Math.max(happinessLevel, 1), 10),
      anxietyLevel: Math.min(Math.max(anxietyLevel, 1), 10),
      advice: advice,
      isCrisis: lowerContent.includes('suicide') || lowerContent.includes('kill myself') || lowerContent.includes('end my life')
    };
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
  // Handle undefined or empty message
  if (!message || typeof message !== 'string') {
    return "I'm here to listen. Could you share what's on your mind?";
  }
  
  const lowerCaseMsg = message.toLowerCase();
  if (lowerCaseMsg.includes("suicide") || lowerCaseMsg.includes("kill myself") || lowerCaseMsg.includes("end my life")) {
    return "I am deeply concerned about what you are going through. Please reach out to a professional or a crisis helpline immediately. In many places, you can call 988 or your local emergency services. You are not alone.";
  }

  if (!isAIAvailable() || !ai) {
    return getIntelligentChatResponse(message);
  }

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role as 'user' | 'model',
        parts: [h.content]
      })),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      }
    });
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return getIntelligentChatResponse(message);
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

// Helper to get specific psychological tips based on sentiment
export function getHappyTips(): string {
  const tips = FALLBACK_RESPONSES.happyTips;
  const index = Math.floor(Math.random() * tips.length);
  return tips[index];
}

export function getSadTips(): string {
  const tips = FALLBACK_RESPONSES.sadTips;
  const index = Math.floor(Math.random() * tips.length);
  return tips[index];
}

export function getAnxiousTips(): string {
  const tips = FALLBACK_RESPONSES.anxiousTips;
  const index = Math.floor(Math.random() * tips.length);
  return tips[index];
}
