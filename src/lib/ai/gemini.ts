import { appConfig, env } from "../config";
import { logger } from "../logger";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export async function callGemini(prompt: string, systemPrompt?: string) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const body = {
    contents: [
      ...(systemPrompt
        ? [{ role: "system", parts: [{ text: systemPrompt }] }]
        : []),
      { parts: [{ text: prompt }] },
    ],
    generationConfig: { temperature: 0.2 },
  };

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= appConfig.aiMaxRetries) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify(body),
          cache: "no-store",
          next: { revalidate: 0 },
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini request failed with status ${res.status}`);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty Gemini response");
      return text;
    } catch (error) {
      lastError = error;
      attempt += 1;
      const delay = 200 * 2 ** attempt;
      logger.warn({ error, attempt }, "Gemini call failed, retrying");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Gemini call failed");
}
