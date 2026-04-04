import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The platform injects process.env.GEMINI_API_KEY automatically.
// @ts-ignore - process is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.0-flash";

export interface GameData {
  word: string;
  hints: string[];
  funFact: string;
}

async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && retries < maxRetries) {
        retries++;
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.warn(`Rate limit hit (429). Retrying in ${Math.round(delay)}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Generates a single secret word with its hints and a fun fact in one batch.
 */
export async function generateGameData(category: string, difficulty: string = 'moyen'): Promise<GameData | null> {
  let difficultyPrompt = "";
  if (difficulty === 'facile') {
    difficultyPrompt = "Choisis un mot extrêmement simple et connu de tous, niveau enfant.";
  } else if (difficulty === 'difficile') {
    difficultyPrompt = "Choisis un mot difficile, technique ou peu commun, niveau expert.";
  } else {
    difficultyPrompt = "Choisis un mot de difficulté moyenne, connu du grand public.";
  }

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Génère UN SEUL mot secret pour la catégorie "${category}". 
      ${difficultyPrompt}
      Les données doivent être en français.
      
      Règles pour les indices :
      1. Indice 1 : Très vague, conceptuel.
      2. Indice 2 : Moyen, description physique ou fait marquant.
      3. Indice 3 : Très fort, évocateur (sans donner le mot).
      Règle absolue : NE JAMAIS UTILISER LE MOT SECRET NI SA RACINE DANS LES INDICES.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            hints: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 3,
              maxItems: 3
            },
            funFact: { type: Type.STRING }
          },
          required: ["word", "hints", "funFact"]
        }
      }
    }));

    if (response.text) {
      const data: GameData = JSON.parse(response.text);
      return {
        word: data.word.trim(),
        hints: data.hints.map(h => h.trim()),
        funFact: data.funFact.trim()
      };
    }
    return null;
  } catch (error: any) {
    console.error("Error generating game data:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    return null;
  }
}

export async function generateRandomCategories(): Promise<string[]> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Génère une liste de 6 idées de catégories très connues pour un jeu de devinettes. 
      Les catégories doivent être en français, simples, et variées. 
      N'inclus pas de descriptions, juste les noms.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.8
      }
    }));

    if (response.text) {
      const categories: string[] = JSON.parse(response.text);
      return categories.map(c => c.trim()).filter(c => c.length > 0).slice(0, 6);
    }
    return [];
  } catch (error) {
    console.error("Error generating random categories:", error);
    return [
      "Titres de films", "Garnitures de pizza", "Peintres célèbres", 
      "Animaux marins", "Capitales du monde", "Instruments de musique"
    ];
  }
}

export async function generateCrazyCategory(): Promise<string> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Invente UNE SEULE catégorie complètement absurde ou drôle pour un jeu de devinettes. 
      Renvoie uniquement le nom de la catégorie en français.`,
      config: {
        temperature: 0.9
      }
    }));
    return response.text?.trim() || "Objets trouvés dans la poche d'un magicien";
  } catch (error) {
    console.error("Error generating crazy category:", error);
    return "Objets trouvés dans la poche d'un magicien";
  }
}

export async function validateGuessWithGemini(guess: string, category: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Est-ce que "${guess}" appartient à la catégorie "${category}" ? 
      Réponds uniquement par vrai ou faux en JSON. Tolère les fautes d'orthographe mineures.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN }
          },
          required: ["valid"]
        }
      }
    }));

    if (response.text) {
      const result = JSON.parse(response.text);
      return result.valid === true;
    }
    return false;
  } catch (error) {
    console.error("Error validating guess:", error);
    return true; 
  }
}
