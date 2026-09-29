const BASE_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'; upgrade-insecure-requests";

const GAME_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'";

// Replace with the random token from FormSubmit's activation email
// (or keep your email address until you have the token).
const FORMSUBMIT_TARGET = "https://formsubmit.co/ajax/YOUR_RANDOM_TOKEN";
const SITE_ORIGIN = "https://akramawel.com";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleContact(request) {
  if (request.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  // Only accept submissions coming from your own site
  const origin = request.headers.get("Origin");
  if (origin && origin !== SITE_ORIGIN && origin !== "https://www.akramawel.com") {
    return json({ success: false, message: "Forbidden" }, 403);
  }

  let data;
  try {
    const raw = await request.text();
    if (raw.length > 10000) {
      return json({ success: false, message: "Payload too large" }, 413);
    }
    data = JSON.parse(raw);
  } catch {
    return json({ success: false, message: "Invalid JSON" }, 400);
  }

  // Honeypot: bots fill hidden fields, humans don't
  if (data._honey) {
    return json({ success: true });
  }

  if (!data.name || !data.email || !data.message) {
    return json({ success: false, message: "Missing fields" }, 400);
  }

  try {
    const res = await fetch(FORMSUBMIT_TARGET, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: SITE_ORIGIN,
        Referer: SITE_ORIGIN + "/",
      },
      body: JSON.stringify({
        name: String(data.name).slice(0, 200),
        email: String(data.email).slice(0, 200),
        message: String(data.message).slice(0, 5000),
        _subject: "New message from akramawel.com",
        _captcha: "false",
        _template: "table",
      }),
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return json({ success: false, message: "Upstream error" }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContact(request);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    const isGame = url.pathname === "/portfolio.html";

    headers.set("Content-Security-Policy", isGame ? GAME_CSP : BASE_CSP);
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};