
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzePlan(planData: any, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Du bist ein erfahrener Personalplaner. Analysiere den folgenden Schichtplan und beantworte die Nutzeranfrage.
          
          PLAN-DATEN (JSON): ${JSON.stringify(planData)}
          NUTZERANFRAGE: ${userPrompt}
        `,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }

  async searchHolidays(year: number, state: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Was sind die gesetzlichen Feiertage im Jahr ${year} für das Bundesland ${state} in Deutschland?`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Search Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
