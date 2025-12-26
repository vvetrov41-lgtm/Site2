export async function onRequestPost({ request, env }) {
  try {
    const { message } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = "gemini-1.5-flash"; // можно поменять позже
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "No response";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
