import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class NeuralService {
  static async generateJournalPrompt(role: string) {
    try {
      const promptText = `Generate a single, deeply reflective, and slightly futuristic journaling prompt for a mental health app. 
      The user is categorized as a "${role}". Keep it under 15 words.
      Return JSON: { "prompt": "..." }`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(result.text).prompt;
    } catch (error) {
      console.error("Neural prompt failure:", error);
      return "Transcribe your current mental state...";
    }
  }

  static async getDailyProtocols(profile: any, recentMoods: any[]) {
    try {
      const moodContext = recentMoods.map(m => `Mood: ${m.score}/10`).join(', ');
      const prompt = `User Profile: ${profile.displayName}, Role: ${profile.role}. Recent Moods: [${moodContext}].
      Generate 3 specific, professional, and slightly futuristic wellness "protocols" (tasks) for today.
      Return JSON: { "protocols": [ { "id": "1", "title": "...", "description": "...", "type": "meditation" | "activity" | "social" } ] }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text).protocols;
    } catch (error) {
      console.error("Protocol generation failure:", error);
      return [];
    }
  }

  static async getNeuralMapAnalysis(moods: any[]) {
    try {
      const context = moods.map(m => `Score: ${m.score}`).join(', ');
      const prompt = `Analyze this sequence of emotional scores: [${context}]. 
      Describe this constellation as if it were a cosmic event or a neural landscape.
      Return JSON: { "title": "...", "analysis": "..." }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text);
    } catch (error) {
       return { title: "Equilibrium", analysis: "Steady state detected." };
    }
  }
}
