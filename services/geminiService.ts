import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResult, DetectorType } from "../types";
import { DETECTORS } from "../constants";

const getSystemInstruction = (type: DetectorType): string => {
  const detector = DETECTORS.find((d) => d.id === type);
  return detector ? detector.systemInstruction : "Analyze the content for fraud or misinformation.";
};

export const analyzeContent = async (
  type: DetectorType,
  content: string,
  mediaData?: { mimeType: string; data: string }[]
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = getSystemInstruction(type);

  try {
    const parts: any[] = [];
    
    // Add media if present (support multiple files)
    if (mediaData && mediaData.length > 0) {
      mediaData.forEach(media => {
        parts.push({
          inlineData: {
            mimeType: media.mimeType,
            data: media.data,
          },
        });
      });
    }

    // Add text content if present
    if (content) {
      parts.push({
        text: content,
      });
    }

    // Using gemini-3-pro-preview for complex reasoning and higher accuracy as per requirements
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts }, 
      config: {
        systemInstruction: systemInstruction,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            domain: { type: Type.STRING },
            label: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
            reason: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["domain", "label", "confidence", "reason"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini Empty Response:", JSON.stringify(response, null, 2));
      throw new Error("No response from AI model. The content might have been blocked by safety filters.");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};