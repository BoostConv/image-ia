import type {
  AspectRatio,
  GenerationResult,
  NanoBananaResponse,
} from "./types";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

function getApiKey(): string {
  const key = process.env.NANO_BANANA_API_KEY;
  if (!key) throw new Error("NANO_BANANA_API_KEY manquante dans .env.local");
  return key;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImage(params: {
  prompt: string;
  systemInstruction?: string;
  aspectRatio?: AspectRatio;
  referenceImage?: Buffer;
  referenceImages?: Buffer[];
  referenceImageRoles?: string[];
  temperature?: number;
}): Promise<GenerationResult> {
  const apiKey = getApiKey();

  const parts: Array<
    { text: string } | { inline_data: { mime_type: string; data: string } }
  > = [];

  // Add all reference images WITH role annotations
  if (params.referenceImages && params.referenceImages.length > 0) {
    const roles = params.referenceImageRoles || [];
    for (let i = 0; i < params.referenceImages.length; i++) {
      const role = roles[i] || "reference";
      const roleLabel = role === "product_fidelity"
        ? "PHOTO DU VRAI PRODUIT — reproduire ce packaging à l'IDENTIQUE (forme, couleurs, étiquette, logo). NE JAMAIS modifier, recolorer ou inventer."
        : role === "layout_structure"
        ? "INSPIRATION DE COMPOSITION — reproduire cette structure de mise en page, PAS le contenu."
        : role === "brand_style"
        ? "RÉFÉRENCE DE STYLE MARQUE — reproduire ce style visuel et cette direction artistique."
        : "Image de référence.";
      parts.push({ text: `[IMAGE ${i + 1}: ${roleLabel}]` });
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: params.referenceImages[i].toString("base64"),
        },
      });
    }
  } else if (params.referenceImage) {
    parts.push({ text: "[IMAGE PRODUIT — reproduire ce packaging à l'IDENTIQUE]" });
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: params.referenceImage.toString("base64"),
      },
    });
  }

  // Prepend aspect ratio instruction to prompt text (API doesn't support imageSizeOptions)
  const aspectHint = params.aspectRatio
    ? `Generate this image in ${params.aspectRatio} aspect ratio. `
    : "";
  parts.push({ text: aspectHint + params.prompt });

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
    temperature: params.temperature ?? 1,
  };

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig,
  };

  // System instruction — persistent brand identity & rules (higher weight than user prompt)
  if (params.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: params.systemInstruction }],
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 2000;
        await sleep(delay);
        continue;
      }

      if (response.status >= 500) {
        await sleep(5000);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          images: [],
          error: `Erreur API (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      return extractImages(data);
    } catch (err) {
      lastError = err as Error;
      await sleep(2000);
    }
  }

  return {
    success: false,
    images: [],
    error: lastError?.message || "Echec apres 3 tentatives",
  };
}

function extractImages(data: any): GenerationResult {
  const images: Array<{ data: Buffer; mimeType: string }> = [];
  let text: string | undefined;

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      // API returns camelCase (inlineData) not snake_case (inline_data)
      const inlineData = part.inline_data || part.inlineData;
      if (inlineData) {
        images.push({
          data: Buffer.from(inlineData.data, "base64"),
          mimeType: inlineData.mimeType || inlineData.mime_type,
        });
      }
      if (part.text) {
        text = part.text;
      }
    }
  }

  if (images.length === 0) {
    return {
      success: false,
      images: [],
      text,
      error: text || "Aucune image generee par l'API",
    };
  }

  return { success: true, images, text };
}

export async function generateBatch(params: {
  prompts: string[];
  aspectRatio?: AspectRatio;
  delayMs?: number;
}): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  for (const prompt of params.prompts) {
    const result = await generateImage({
      prompt,
      aspectRatio: params.aspectRatio,
    });
    results.push(result);
    await sleep(params.delayMs ?? 1500);
  }

  return results;
}
