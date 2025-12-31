import { appConfig, env } from "../config";
import { logger } from "../logger";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export async function callGemini(prompt: string, systemPrompt?: string) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const models = Array.from(
    new Set([
      ...(env.GEMINI_MODEL
        ? env.GEMINI_MODEL.split(",").map((m) => m.trim()).filter(Boolean)
        : []),
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-1.0-pro-latest",
      "gemini-1.0-pro",
      "gemini-pro",
    ]),
  );

  const apiVersions = Array.from(
    new Set([
      ...(env.GEMINI_API_VERSION
        ? env.GEMINI_API_VERSION.split(",").map((v) => v.trim()).filter(Boolean)
        : []),
      "v1",
      "v1beta",
    ]),
  );

  const body = {
    contents: [
      ...(systemPrompt
        ? [{ role: "system", parts: [{ text: systemPrompt }] }]
        : []),
      { parts: [{ text: prompt }] },
    ],
    generationConfig: { temperature: 0.2 },
  };

  let lastError: unknown;

  for (const version of apiVersions) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      let attempt = 0;

      while (attempt <= appConfig.aiMaxRetries) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
            next: { revalidate: 0 },
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            const error = new Error(
              `Gemini request failed for model ${model} (version ${version}) with status ${res.status}${
                detail ? `: ${detail}` : ""
              }`,
            );
            (error as any).status = res.status;
            throw error;
          }

          const json = (await res.json()) as GeminiResponse;
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Empty Gemini response");
          return text;
        } catch (error) {
          lastError = error;
          const status = (error as any)?.status;
          const isNotFound = status === 404;
          if (isNotFound) {
            logger.warn({ error, model, version }, "Gemini model not found, trying fallback");
            break;
          }

          attempt += 1;
          const delay = 200 * 2 ** attempt;
          logger.warn({ error, attempt, model, version }, "Gemini call failed, retrying");
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError ?? new Error("Gemini call failed");
}
