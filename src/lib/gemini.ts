export async function fetchGeminiResponse(
  prompt: string,
  context: string,
  imageBase64?: string | null,
  useVision?: boolean
) {
  const res = await fetch("/api/gemini-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context, imageBase64, useVision }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data.text;
}
