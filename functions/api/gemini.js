export async function onRequestPost({ request, env }) {
  try {
    const { prompt, system } = await request.json();

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ reply: "Missing GEMINI_API_KEY in Cloudflare env" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!prompt || !prompt.trim()) {
      return new Response(JSON.stringify({ reply: "No prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = "gemini-1.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      const msg =
        data?.error?.message ||
        data?.error?.status ||
        JSON.stringify(data);
      return new Response(JSON.stringify({ reply: `Gemini API error (${r.status}): ${msg}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "";

    if (!text) {
      const reason =
        data?.promptFeedback?.blockReason ||
        "Empty candidates/content (check API key, billing, model access, or safety)";
      return new Response(JSON.stringify({ reply: `No text returned: ${reason}` }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: `Server error: ${String(e)}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}