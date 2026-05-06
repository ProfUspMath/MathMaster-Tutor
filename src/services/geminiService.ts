import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Access API key depending on environment
    const apiKey = 
      (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.GOOGLE_GENAI_API_KEY)) ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      throw new Error("No se encontró la API Key. Asegúrate de que GEMINI_API_KEY esté configurada.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getTutorResponse(message: string, history: ChatMessage[]) {
  const ai = getAI();
  
  // The history is already formatted as { role, parts } by the caller
  const contents = [...history];

  // Add current user message
  contents.push({ role: 'user', parts: [{ text: message }] });

  // Use the modern SDK pattern: ai.models.generateContent
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `Actúas como un Desarrollador Senior de Python y Profesor de Matemáticas experto en Didáctica del Cálculo y Álgebra.
Tu tono es de un colega profesor: paciente, preciso y técnicamente impecable.

Misión:
1. Resolver problemas de Cálculo (derivadas, integrales, límites) y Álgebra (sistemas de ecuaciones, simplificación).
2. Explicación paso a paso: Usa listas numeradas. Cada paso debe ser detallado pedagógicamente.
3. Usa notación LaTeX: Envuelve TODAS las expresiones matemáticas en símbolos de dólar (ej: $x^2$ o $$ \int x dx $$).
4. IMPORTANTE: Cuando resuelvas un ejercicio completo, termina tu respuesta con este formato exacto:
   ---EXERCISE_START---
   Título: [Nombre del tema]
   Contenido: [Enunciado del problema en LaTeX]
   ---EXERCISE_END---`
    }
  });

  return response.text || "No pude obtener una respuesta.";
}
