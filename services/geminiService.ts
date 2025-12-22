
import { GoogleGenAI } from "@google/genai";
import { Program } from "../types";

// Always use named parameter and direct process.env.API_KEY reference
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateFestInsights(programs: Program[]) {
  try {
    const prompt = `Analyze the following festival program data and provide a concise 2-sentence executive summary of the festival progress and any notable trends in 2 sentences.
    Data: ${JSON.stringify(programs.map(p => ({ name: p.name, status: p.status, category: p.category })))}`;

    // Correctly call generateContent with model and contents
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Use .text property directly as per guidelines
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to load AI insights. Please check your connection.";
  }
}
