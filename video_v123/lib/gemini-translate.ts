import type { SubtitleCue } from "@/constants/studio";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

type GeminiModel = { name?: string; supportedGenerationMethods?: string[] };
type GeminiModelsResponse = { models?: GeminiModel[] };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

async function requestJson<T>(url: string, apiKey: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "x-goog-api-key": apiKey, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 400 || response.status === 403) {
      throw new Error("Gemini từ chối API key hoặc request. Kiểm tra key/quyền API trong Google AI Studio.");
    }
    if (response.status === 429) throw new Error("Gemini đang giới hạn lượt gọi. Hãy chờ một lúc rồi thử lại.");
    throw new Error(`Gemini API lỗi ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`);
  }
  return response.json() as Promise<T>;
}

async function chooseGenerateModel(apiKey: string): Promise<string> {
  const result = await requestJson<GeminiModelsResponse>(`${API_ROOT}/models`, apiKey);
  const models = (result.models ?? []).filter((model) =>
    model.name && model.supportedGenerationMethods?.includes("generateContent"),
  );
  const preferred = models.find((model) => /gemini-[\d.]+-flash(?:-|$)/i.test(model.name ?? "")) ??
    models.find((model) => /gemini.*flash/i.test(model.name ?? "")) ??
    models.find((model) => /gemini/i.test(model.name ?? ""));
  if (!preferred?.name) throw new Error("API key chưa có model Gemini hỗ trợ generateContent.");
  return preferred.name;
}

function extractJsonArray(text: string): Array<{ id: string; translated: string }> {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("Gemini trả về kết quả không đúng định dạng cue.");
  const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Kết quả dịch không phải danh sách cue.");
  return parsed.filter((item): item is { id: string; translated: string } =>
    Boolean(item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" && typeof (item as { translated?: unknown }).translated === "string"),
  );
}

export async function translateCuesWithGemini(
  apiKey: string,
  cues: SubtitleCue[],
  sourceLanguage = "English",
  targetLanguage = "Vietnamese",
  onProgress?: (completed: number, total: number) => void,
): Promise<SubtitleCue[]> {
  if (!apiKey.trim()) throw new Error("Chưa lưu Gemini API key. Mở Cài đặt để thêm key trước.");
  if (cues.length === 0) throw new Error("Tệp không có cue để dịch.");

  const model = await chooseGenerateModel(apiKey.trim());
  const output = new Map<string, string>();
  const batchSize = 24;
  const batches = Math.ceil(cues.length / batchSize);

  for (let offset = 0; offset < cues.length; offset += batchSize) {
    const batch = cues.slice(offset, offset + batchSize);
    const prompt = [
      `Translate the subtitle cues from ${sourceLanguage} to ${targetLanguage}.`,
      "Return only a JSON array. Every object must have exactly: id (string) and translated (string).",
      "Preserve every cue ID exactly; translate only the spoken text; keep names, tone, punctuation, and line meaning natural.",
      "Do not add, remove, merge, split, reorder, or renumber cues. Do not include timestamps in the output.",
      JSON.stringify(batch.map(({ id, source }) => ({ id, text: source }))),
    ].join("\n");

    const response = await requestJson<GeminiResponse>(`${API_ROOT}/${model}:generateContent`, apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { id: { type: "STRING" }, translated: { type: "STRING" } },
            required: ["id", "translated"],
          },
        },
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini không trả về nội dung dịch.");
    for (const item of extractJsonArray(text)) output.set(item.id, item.translated.trim());
    onProgress?.(Math.min(offset + batch.length, cues.length), cues.length);
  }

  const missing = cues.filter((cue) => !output.has(cue.id));
  if (missing.length) throw new Error(`Thiếu kết quả dịch cho ${missing.length} cue. Hãy thử lại.`);
  return cues.map((cue) => ({ ...cue, translated: output.get(cue.id) ?? "" }));
}
