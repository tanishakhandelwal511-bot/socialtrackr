import { GoogleGenAI, Type } from "@google/genai";
import { Platform, Goal, ExperienceLevel, ContentDay } from './types.ts';

// The API key is sourced from process.env.API_KEY
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generate30DayCalendar(
  platform: Platform,
  niche: string,
  goal: Goal,
  level: ExperienceLevel
): Promise<ContentDay[]> {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Generate a 30-day content calendar for a ${level} content creator on ${platform} focusing on the niche: "${niche}". 
  The primary goal is ${goal}. 
  Provide specific, actionable content ideas for each day.
  Include catchy hooks, engaging captions, clear CTAs, 5 relevant hashtags, and a pro tip for growth.
  The formats should be typical for ${platform}.`;

  const response = await genAI.models.generateContent({
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
            script: { type: Type.STRING, description: "Optional script if format is video-based" }
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
      completed: false
    }));
  } catch (error) {
    console.error("Failed to parse calendar JSON", error);
    throw new Error("Invalid response from AI");
  }
}

export async function chatWithAI(
  message: string, 
  context: { platform?: Platform; niche?: string; currentDayContent?: any }
): Promise<string> {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `You are the Social Trackr Assistant. 
  You help users grow their presence on ${context.platform || 'social media'} in the ${context.niche || 'general'} niche.
  Be energetic, encouraging, and use GenZ slang occasionally like 'W', 'rizz', 'main character', 'viral era'.
  Keep responses concise and actionable.
  Current Day Context: ${JSON.stringify(context.currentDayContent || {})}`;

  const response = await genAI.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction,
      temperature: 0.8,
    }
  });

  return response.text || "I'm having a small glitch in my matrix, bestie. Try again?";
}

export async function regenerateDay(
  platform: Platform,
  niche: string,
  day: number,
  existingContent: ContentDay
): Promise<ContentDay> {
  const model = 'gemini-3-flash-preview';
  const prompt = `Regenerate the content for Day ${day} of a 30-day calendar for ${platform} in the niche ${niche}. 
  The previous idea was: "${existingContent.hook}". Give me something fresh and more engaging.`;

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, completed: false };
}