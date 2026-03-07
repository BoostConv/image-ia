export type AspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

export type Resolution = "512px" | "1K" | "2K" | "4K";

export type GenerationMode = "single" | "batch" | "brief" | "reference";

export interface NanoBananaRequest {
  contents: Array<{
    parts: Array<
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    >;
  }>;
  generationConfig: {
    responseModalities: string[];
    imageSizeOptions?: {
      aspectRatio: AspectRatio;
    };
  };
}

export interface NanoBananaResponse {
  candidates: Array<{
    content: {
      parts: Array<
        | { text: string }
        | { inline_data: { mime_type: string; data: string } }
      >;
    };
  }>;
}

export interface GenerationResult {
  success: boolean;
  images: Array<{
    data: Buffer;
    mimeType: string;
  }>;
  text?: string;
  error?: string;
}

export interface PromptLayers {
  brand: string;
  persona: string;
  brief: string;
  format: string;
  custom: string;
}

export interface FormatPreset {
  id: string;
  label: string;
  description: string;
  aspectRatio: AspectRatio;
  icon: string;
}
