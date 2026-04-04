import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The platform injects process.env.GEMINI_API_KEY automatically.
// @ts-ignore - process is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function generateSecretWords(category: string, difficulty: string = 'moyen'): Promise<string[]> {
  let difficultyPrompt = "";
  if (difficulty === 'facile') {
    difficultyPrompt = "Choisis uniquement les exemples les plus évidents, basiques et connus de tous (niveau enfant).";
  } else if (difficulty === 'difficile') {
    difficultyPrompt = "Choisis des exemples très difficiles, rares, obscurs ou complexes que peu de gens connaissent (niveau expert).";
  } else {
    difficultyPrompt = "Choisis des exemples de difficulté moyenne, connus du grand public.";
  }

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère une liste de 30 exemples pour la catégorie "${category}". 
      ${difficultyPrompt}
      Les exemples doivent être en français. 
      N'inclus pas de descriptions, juste les noms.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }));

    if (response.text) {
      const words: string[] = JSON.parse(response.text);
      // Clean up the words (trim spaces)
      return words.map(w => w.trim()).filter(w => w.length > 0);
    }
    return [];
  } catch (error: any) {
    console.error("Error generating secret words:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    return [];
  }
}

export async function generateRandomCategories(): Promise<string[]> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère une liste de 6 idées de catégories très connues, populaires et accessibles à tous pour un jeu de devinettes (ex: "Animaux de la ferme", "Fruits", "Titres de films célèbres", "Marques de voitures", "Pays du monde", "Instruments de musique"). 
      Les catégories doivent être en français, simples, et pas trop spécifiques ni tirées par les cheveux (1 à 4 mots max). 
      N'inclus pas de descriptions, juste les noms. Renvoie des idées différentes à chaque fois, mais qui restent très grand public.`,
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
      "Titres de films",
      "Garnitures de pizza",
      "Peintres célèbres",
      "Animaux marins",
      "Capitales du monde",
      "Instruments de musique"
    ];
  }
}

export async function generateHint(secretWord: string, category: string, hintLevel: number): Promise<string> {
  let prompt = "";
  if (hintLevel === 1) {
    prompt = `Donne un indice très vague et conceptuel pour faire deviner le mot "${secretWord}" dans la catégorie "${category}". 
    Règle absolue : NE PRONONCE SOUS AUCUN PRÉTEXTE LE MOT EXACT NI SA RACINE. Maximum 2 phrases.`;
  } else if (hintLevel === 2) {
    prompt = `Donne un indice moyen, un peu plus précis (comme une description ou un fait marquant), pour faire deviner le mot "${secretWord}" dans la catégorie "${category}". 
    Règle absolue : NE PRONONCE SOUS AUCUN PRÉTEXTE LE MOT EXACT NI SA RACINE. Maximum 2 phrases.`;
  } else {
    prompt = `Donne un indice très fort et évident pour faire deviner le mot "${secretWord}" dans la catégorie "${category}". 
    Tu peux donner la première lettre, le nombre de lettres, ou un synonyme très proche. 
    Règle absolue : NE PRONONCE SOUS AUCUN PRÉTEXTE LE MOT EXACT. Maximum 2 phrases.`;
  }

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    }));
    return response.text?.trim() || "Désolé, je n'ai pas pu générer d'indice.";
  } catch (error: any) {
    console.error("Error generating hint:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return "Le quota de l'API est dépassé. Veuillez patienter un instant avant de demander un autre indice.";
    }
    return "Erreur lors de la génération de l'indice.";
  }
}

export async function generateCrazyCategory(): Promise<string> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Invente UNE SEULE catégorie complètement absurde, drôle ou très spécifique pour un jeu de devinettes (ex: "Objets trouvés dans la poche d'un magicien", "Choses qu'on dit à son chat", "Noms de potions magiques"). 
      Renvoie uniquement le nom de la catégorie, rien d'autre.`,
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

export async function generateFunFact(word: string, category: string): Promise<string> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Donne une anecdote amusante, insolite ou une courte définition (maximum 2-3 phrases) sur le mot "${word}" dans le contexte de la catégorie "${category}".`,
      config: {
        temperature: 0.7
      }
    }));
    return response.text?.trim() || "Aucune anecdote disponible pour ce mot.";
  } catch (error) {
    console.error("Error generating fun fact:", error);
    return "Aucune anecdote disponible pour ce mot.";
  }
}

export async function validateGuessWithGemini(guess: string, category: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Est-ce que "${guess}" appartient à la catégorie "${category}" ? 
      Réponds uniquement en te basant sur le sens commun. 
      Tolère les fautes d'orthographe mineures.`,
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
    // If the API fails, we might want to let the user play anyway, or reject.
    // Let's accept it to not block the game if the API is flaky.
    return true; 
  }
}
