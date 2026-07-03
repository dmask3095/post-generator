const GEMINI_MODEL = process.env.GEMINI_GENERATION_MODEL || 'gemini-2.5-flash';

// Calls Gemini with JSON-mode output and parses the response. Returns null on
// any failure (missing key, quota, bad JSON) so callers can fall back safely.
export async function generateJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number }
): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: options?.temperature ?? 0.7,
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
