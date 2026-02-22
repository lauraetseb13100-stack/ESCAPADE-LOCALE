import { GoogleGenAI } from "@google/genai";

export interface Activity {
  id: string;
  name: string;
  type: 'market' | 'flea_market' | 'escape_game' | 'festival' | 'recycling' | 'other';
  description: string;
  location: string;
  date?: string;
  link?: string;
}

export interface SearchParams {
  location: string;
  startDate: string;
  endDate: string;
  radius: number;
  lat?: number;
  lng?: number;
}

export async function searchActivities(params: SearchParams): Promise<Activity[]> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `Trouve des activités à faire à ${params.location} et dans un rayon de ${params.radius}km entre le ${params.startDate} et le ${params.endDate}.
  Je recherche spécifiquement :
  - Les marchés (marchés alimentaires, artisanaux)
  - Les brocantes et vide-greniers
  - Les escape games ouverts
  - Les fêtes de village et événements locaux
  - Les recycleries et ressourceries
  
  Pour chaque activité, fournis le nom, le type, une courte description, le lieu précis et si possible la date spécifique ou les jours d'ouverture.
  Réponds sous forme de liste structurée.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: params.lat && params.lng ? {
            latitude: params.lat,
            longitude: params.lng
          } : undefined
        }
      }
    },
  });

  // Since we can't use responseSchema with googleMaps, we'll ask for a structured text and parse it or just return the text for rendering.
  // Actually, it's better to render the markdown response directly for better UX with grounding links.
  return []; // We will handle the response differently in the UI
}
