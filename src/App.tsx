/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  MapPin, 
  Calendar, 
  Search, 
  Loader2, 
  ShoppingBag, 
  Trash2, 
  PartyPopper, 
  Key, 
  Store,
  Navigation,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { format, addDays, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [radius, setRadius] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setGroundingChunks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY});
      
      const prompt = `Je planifie un voyage à ${location || 'ma position actuelle'} du ${startDate} au ${endDate}.
      Je souhaite découvrir les activités suivantes dans un rayon de ${radius}km :
      1. Marchés (locaux, artisanaux)
      2. Brocantes et vide-greniers (consulte spécifiquement vide-greniers.org pour cette zone et ces dates)
      3. Événements locaux et culturels (consulte les agendas municipaux et les sites des mairies de la zone)
      4. Escape games
      5. Fêtes de village et festivals
      6. Recycleries et ressourceries

      Organise ta réponse jour par jour du ${startDate} au ${endDate}. 
      Pour chaque jour, liste les événements spécifiques ou les lieux ouverts qui correspondent à mes critères.
      Sois précis sur les lieux, les horaires et cite tes sources si possible (liens vers vide-greniers.org ou sites de mairies).
      Utilise des titres clairs pour chaque jour.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userCoords ? {
                latitude: userCoords.lat,
                longitude: userCoords.lng
              } : undefined
            }
          }
        },
      });

      setResult(response.text || "Désolé, je n'ai pas trouvé d'activités pour cette période.");
      
      // Combine grounding chunks from both maps and search
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setGroundingChunks(chunks);
    } catch (error) {
      console.error("Search error:", error);
      setResult("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-black/10 py-8 px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#5A5A40]">
              Escapade Locale
            </h1>
            <p className="text-lg italic opacity-70 mt-2">
              Organisez vos journées, découvrez l'authentique.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-sans uppercase tracking-widest opacity-50">
            <Navigation size={14} />
            <span>Rayon de {radius}km</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Search Section */}
        <section className="bg-white rounded-[32px] shadow-xl shadow-black/5 p-8 mb-12 border border-black/5">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-sans font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                <MapPin size={14} /> Destination
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ville, village ou laisser vide pour 'autour de moi'"
                className="w-full bg-[#f5f5f0] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] transition-all font-sans outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-sans font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Navigation size={14} /> Rayon (km)
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-[#5A5A40] h-2 bg-[#f5f5f0] rounded-lg appearance-none cursor-pointer mt-4"
              />
              <div className="flex justify-between text-[10px] font-sans opacity-40">
                <span>5km</span>
                <span>{radius}km</span>
                <span>100km</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-sans font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Calendar size={14} /> Début du séjour
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#f5f5f0] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] transition-all font-sans outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-sans font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Calendar size={14} /> Fin du séjour
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#f5f5f0] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] transition-all font-sans outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A5A40] text-white rounded-full py-4 font-sans font-bold text-lg hover:bg-[#4a4a34] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Découvrir les activités
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-black/10" />
                <h2 className="text-2xl font-bold italic text-[#5A5A40]">Votre Programme</h2>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-black/5 prose prose-stone max-w-none">
                  <div className="markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                </div>

                {groundingChunks.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-sans font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <Info size={14} /> Sources et Lieux identifiés
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {groundingChunks.map((chunk, idx) => {
                        if (chunk.maps) {
                          return (
                            <a
                              key={idx}
                              href={chunk.maps.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white p-4 rounded-2xl border border-black/5 hover:border-[#5A5A40] transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#5A5A40]">
                                  <MapPin size={18} />
                                </div>
                                <span className="font-sans font-medium text-sm line-clamp-1">{chunk.maps.title}</span>
                              </div>
                              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-[#5A5A40]" />
                            </a>
                          );
                        } else if (chunk.web) {
                          return (
                            <a
                              key={idx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white p-4 rounded-2xl border border-black/5 hover:border-[#5A5A40] transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#5A5A40]">
                                  <Search size={18} />
                                </div>
                                <span className="font-sans font-medium text-sm line-clamp-1">{chunk.web.title}</span>
                              </div>
                              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-[#5A5A40]" />
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="flex justify-center gap-8 opacity-20">
                <ShoppingBag size={48} />
                <Trash2 size={48} />
                <Key size={48} />
                <PartyPopper size={48} />
                <Store size={48} />
              </div>
              <p className="text-xl italic opacity-40 max-w-md mx-auto">
                Entrez vos dates et votre destination pour voir apparaître les trésors locaux.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/10 py-12 px-6 bg-white/30">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-sans opacity-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-bold">E</div>
            <span>Escapade Locale © 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#5A5A40] transition-colors">À propos</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
