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
  aspectRatio?: AspectRatio;
  referenceImage?: Buffer;
}): Promise<GenerationResult> {
  const apiKey = getApiKey();

  const parts: Array<
    { text: string } | { inline_data: { mime_type: string; data: string } }
  > = [];

  if (params.referenceImage) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: params.referenceImage.toString("base64"),
      },
    });
  }

  // Inject aspect ratio as a prompt instruction since gemini-2.0-flash-exp
  // does not support imageSizeOptions in generationConfig
  let promptText = params.prompt;
  if (params.aspectRatio && params.aspectRatio !== "1:1") {
    promptText += `\n\nAspect ratio: ${params.aspectRatio}. Compose the image to fit this exact ratio.`;
  }
  parts.push({ text: promptText });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

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
