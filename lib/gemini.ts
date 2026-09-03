/**
 * Gemini adapter.
 *
 * Server-only. Wraps Google's Generative Language REST API so the rest of
 * the app talks in plain JSON Schema and never touches HTTP directly. Chosen
 * over OpenAI for this build because Google AI Studio issues a free-tier key
 * with no billing setup — https://aistudio.google.com/apikey — which matters
 * when the person running this has no card on file.
 *
 * If you do have a paid OpenAI key, swap this file for one that calls
 * `client.chat.completions.create` with `response_format: json_schema` as in
 * the original design notes; every caller here only needs `parseSentence`
 * and `generateText`, so the rest of the app does not change.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Override with GEMINI_MODEL if Google renames or retires this model. */
const DEFAULT_MODEL = "gemini-2.5-flash";

type JsonSchema = Record<string, any>;

/**
 * Convert a provider-neutral JSON Schema (using `type: [T, "null"]` for
 * optional fields) into the subset Gemini's `responseSchema` accepts
 * (uppercase type names, a `nullable` flag instead of a type union, no
 * `additionalProperties`).
 */
function toGeminiSchema(schema: JsonSchema): JsonSchema {
  if (schema === null || typeof schema !== "object") return schema;

  let type = schema.type;
  let nullable = false;

  if (Array.isArray(type)) {
    nullable = type.includes("null");
    type = type.find((t: string) => t !== "null") ?? "string";
  }

  const typeMap: Record<string, string> = {
    string: "STRING",
    integer: "INTEGER",
    number: "NUMBER",
    boolean: "BOOLEAN",
    array: "ARRAY",
    object: "OBJECT",
  };

  const out: JsonSchema = {};
  if (type) out.type = typeMap[type] ?? "STRING";
  if (nullable) out.nullable = true;
  if (schema.description) out.description = schema.description;

  if (Array.isArray(schema.enum)) {
    const values = schema.enum.filter((v: unknown) => v !== null);
    if (values.length > 0) out.enum = values;
  }

  if (schema.items) out.items = toGeminiSchema(schema.items);

  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        toGeminiSchema(value as JsonSchema),
      ])
    );
  }

  if (Array.isArray(schema.required)) out.required = schema.required;

  return out;
}

interface StructuredArgs {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  userText: string;
  schema: JsonSchema;
  temperature?: number;
}

/** Call Gemini and get back a value that matches `schema` exactly. */
export async function generateStructured<T = unknown>({
  apiKey,
  model,
  systemInstruction,
  userText,
  schema,
  temperature = 0.1,
}: StructuredArgs): Promise<T> {
  const url = `${API_BASE}/${model ?? DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(schema),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content.");

  return JSON.parse(text) as T;
}

interface TextArgs {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  userText: string;
  temperature?: number;
}

/** Call Gemini for a plain-text answer (used to phrase the final response). */
export async function generateText({
  apiKey,
  model,
  systemInstruction,
  userText,
  temperature = 0.2,
}: TextArgs): Promise<string> {
  const url = `${API_BASE}/${model ?? DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ?? "";
}
