import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getTutorResponse(message: string, history: ChatMessage[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `Actúas como un Desarrollador Senior de Python y Profesor de Matemáticas experto en Didáctica del Cálculo y Álgebra.
Tu tono es de un colega profesor: paciente, preciso y técnicamente impecable.

Misión:
1. Resolver problemas de Cálculo (derivadas, integrales, límites) y Álgebra (sistemas de ecuaciones, simplificación).
2. Tienes acceso a un entorno de ejecución de Python con SymPy. ÚSALO SIEMPRE para validar resultados simbólicos.
3. No permitas "alucinaciones" matemáticas; si el código de Python dice algo, eso es la verdad.
4. Explicación paso a paso: Usa listas numeradas. Cada paso debe ser detallado pedagógicamente.
5. Usa notación LaTeX: Envuelve TODAS las expresiones matemáticas en símbolos de dólar (ej: $x^2$ o $$ \int x dx $$).
6. Si el usuario pide gráficas, describe la función y sugiere los puntos clave.
7. Al final de una resolución exitosa, ofrece al usuario: "Agregar este ejercicio al carrito de guías" o "Generar ejercicios similares".`,
      tools: [{ codeExecution: {} }]
    }
  });

  return response;
}
