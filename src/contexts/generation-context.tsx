"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  concept?: string;
  angle?: string;
  level?: string;
  emotion?: string;
}

export interface Concept {
  concept: string;
  angle: string;
  level: string;
  emotion: string;
}

export interface StartGenerationParams {
  endpoint: "/api/generate-batch" | "/api/generate-custom";
  body: Record<string, unknown>;
  brandId: string;
  brandName: string;
  totalCount: number;
  /** When true, don't clear previous images (used for multi-format sequential calls) */
  appendMode?: boolean;
}

interface GenerationContextValue {
  // State
  isGenerating: boolean;
  phase: string;
  phaseMessage: string;
  progress: { current: number; total: number };
  batchStats: { completed: number; failed: number };
  error: string | null;
  generatedImages: GeneratedImage[];
  concepts: Concept[];
  currentConcept: string;
  brandId: string | null;
  brandName: string | null;

  // Actions
  startGeneration: (params: StartGenerationParams) => Promise<void>;
  cancelGeneration: () => void;
  clearResults: () => void;
}

// ─── Context ──────────────────────────────────────────────────

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function useGeneration(): GenerationContextValue {
  const ctx = useContext(GenerationContext);
  if (!ctx) {
    throw new Error("useGeneration must be used within a GenerationProvider");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────

export function GenerationProvider({ children }: { children: ReactNode }) {
  // ── State ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState("");
  const [phaseMessage, setPhaseMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [batchStats, setBatchStats] = useState({ completed: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [currentConcept, setCurrentConcept] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);

  // ── Refs (survive across async operations) ──
  const abortRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);

  // ── SSE Stream Reader ──
  const readSSEStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      setError("Pas de stream disponible");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));

          switch (event.type) {
            case "phase":
              setPhase(event.phase);
              setPhaseMessage(event.message);
              break;
            case "concepts":
              setConcepts(event.concepts);
              break;
            case "progress":
              setProgress({ current: event.current, total: event.total });
              if (event.concept) setCurrentConcept(event.concept);
              break;
            case "image":
              setGeneratedImages((prev) => [
                {
                  id: event.id,
                  url: event.url,
                  prompt: event.concept || "",
                  concept: event.concept,
                  angle: event.angle || event.layout,
                  level: event.level,
                  emotion: event.emotion,
                },
                ...prev,
              ]);
              setBatchStats((s) => ({ ...s, completed: s.completed + 1 }));
              break;
            case "error":
              setBatchStats((s) => ({ ...s, failed: s.failed + 1 }));
              break;
            case "complete":
              setPhase("complete");
              if (event.completed === 0) {
                setError(
                  `Aucun visuel genere sur ${event.total} demandes. L'API de generation d'images a echoue. Verifiez votre cle API et les logs serveur.`
                );
                setPhaseMessage("Echec de la generation");
              } else {
                setPhaseMessage(
                  `Termine ! ${event.completed} visuels generes${event.failed > 0 ? `, ${event.failed} echecs` : ""}`
                );
              }
              break;
            case "fatal_error":
              setError(event.error);
              break;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }, []);

  // ── Start Generation ──
  const startGeneration = useCallback(
    async (params: StartGenerationParams) => {
      // If already generating and not in append mode, abort the previous stream
      if (isGeneratingRef.current && !params.appendMode) {
        abortRef.current?.abort();
      }

      // Reset state for fresh start (but not in append mode)
      if (!params.appendMode) {
        setGeneratedImages([]);
        setConcepts([]);
        setBatchStats({ completed: 0, failed: 0 });
        setError(null);
        setCurrentConcept("");
      }

      setIsGenerating(true);
      isGeneratingRef.current = true;
      setBrandId(params.brandId);
      setBrandName(params.brandName);
      setPhase("starting");
      setPhaseMessage("Demarrage...");
      setProgress({ current: 0, total: params.totalCount });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(params.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params.body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Erreur lors de la generation");
          setIsGenerating(false);
          isGeneratingRef.current = false;
          return;
        }

        await readSSEStream(response);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const msg = (err as Error).message || String(err);
          console.error("[Generation] Stream error:", msg);
          setError(`Erreur de connexion: ${msg}. Le serveur a peut-etre plante. Verifiez les logs.`);
        }
      }

      setIsGenerating(false);
      isGeneratingRef.current = false;
      abortRef.current = null;
    },
    [readSSEStream]
  );

  // ── Cancel Generation ──
  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    isGeneratingRef.current = false;
    setPhase("");
    setPhaseMessage("");
  }, []);

  // ── Clear Results ──
  const clearResults = useCallback(() => {
    setGeneratedImages([]);
    setConcepts([]);
    setPhase("");
    setPhaseMessage("");
    setProgress({ current: 0, total: 0 });
    setBatchStats({ completed: 0, failed: 0 });
    setError(null);
    setCurrentConcept("");
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const value: GenerationContextValue = {
    isGenerating,
    phase,
    phaseMessage,
    progress,
    batchStats,
    error,
    generatedImages,
    concepts,
    currentConcept,
    brandId,
    brandName,
    startGeneration,
    cancelGeneration,
    clearResults,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}
