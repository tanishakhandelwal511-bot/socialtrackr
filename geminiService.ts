import { GoogleGenAI, Type } from "@google/genai";
import { Platform, Goal, ExperienceLevel, ContentDay, ContentFormat } from './types';

export async function generateMonthCalendar(
  month: number,
  platform: Platform,
  niche: string,
  goal: Goal,
  level: ExperienceLevel,
  formats: ContentFormat[]
): Promise<ContentDay[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2025, month));
  
  const prompt = `Generate a content calendar for the month of ${monthName} for a ${level} content creator on ${platform} in the niche: "${niche}". 
  Primary goal: ${goal}. 
  Only use these formats: ${formats.join(', ')}.
  Provide 30 days of unique ideas. Return a JSON array of objects.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            format: { type: Type.STRING },
            hook: { type: Type.STRING },
            caption: { type: Type.STRING },
            cta: { type: Type.STRING },
            hashtags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tip: { type: Type.STRING },
            script: { type: Type.STRING }
          },
          required: ["day", "format", "hook", "caption", "cta", "hashtags", "tip"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({
      ...item,
      month,
      completed: false
    }));
  } catch (error) {
    console.error("Failed to parse calendar JSON", error);
    throw new Error("AI output was malformed.");
  }
}

export async function chatWithAI(
  message: string, 
  context: { platform?: Platform; niche?: string; currentDayContent?: any }
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `You are the Social Trackr Assistant. 
  You help users grow their presence on ${context.platform || 'social media'} in the ${context.niche || 'general'} niche.
  Be energetic, encouraging, and use GenZ slang (rizz, no cap, main character).
  Keep responses concise.`;

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction,
      temperature: 0.8,
    }
  });

  return response.text || "Glitch in the matrix, bestie. Try again?";
}