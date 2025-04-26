import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, context, imageBase64 } = req.body;
  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: "Missing prompt or image" });
  }

  try {
    const modelName = "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    let result, response;
    if (imageBase64) {
      // Vision model: send image and prompt
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: context ? context + "\n" + prompt : prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64.split(",")[1],
                },
              },
            ],
          },
        ],
      });
      response = result.response;
    } else {
      // Flash model: text only
      const chat = model.startChat({
        history: context
          ? [
              {
                role: "user",
                parts: [{ text: context }],
              },
            ]
          : [],
      });
      result = await chat.sendMessage(prompt);
      response = result.response;
    }
    return res.status(200).json({ text: response.text() });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
