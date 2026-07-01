import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a UI theme generator for a personal portfolio website. The user describes a mood or style. Respond with ONLY one JSON object, no markdown or prose, with EXACTLY these keys: bg, surface, text, muted, border, accent, accentText, navActive (all CSS hex colors); displayFont, bodyFont (names of real Google Fonts that fit the mood); fontFallback (one of "serif", "sans-serif", "monospace"); titleWeight (heading weight 400-800 as a number); radius (card corner radius like "14px" — small for sharp/brutalist, large for soft/playful); chipRadius (smaller radius like "8px"); dark (boolean, true for dark themes); vibe (2-4 word label). Rules: text must strongly contrast bg and surface; accentText must contrast accent; muted is a low-contrast version of text; surface is a card color close to bg; border is subtle. Pick colors and fonts that genuinely match the described mood.`;

export async function POST(req: Request) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ error: "Describe a vibe first." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "The restyle service is not configured (missing API key)." },
      { status: 500 }
    );
  }

  try {
    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Return the raw model text; the client parses and validates it.
    return Response.json({ raw });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `The model could not be reached: ${detail}` },
      { status: 502 }
    );
  }
}
