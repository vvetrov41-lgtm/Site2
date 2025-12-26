export async function onRequestPost({ request, env }) {
  try {
    const { prompt, system } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ reply: "No prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "No response";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}