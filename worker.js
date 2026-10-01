import { EmailMessage } from "cloudflare:email";

const BASE_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'; upgrade-insecure-requests";

const GAME_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'";

const ALLOWED_ORIGINS = ["https://akramawel.com", "https://www.akramawel.com"];

/*
  Sends mail with Cloudflare's built-in send_email binding (no third party).

  Setup:
    - Email Routing enabled on akramawel.com, with your inbox added and
      verified as a destination address (Cloudflare dashboard).
    - wrangler.jsonc has:  "send_email": [{ "name": "EMAIL" }]
    - Secret:  npx wrangler secret put CONTACT_TO   (your verified inbox)
  Optional:
    - CONTACT_FROM var (defaults below). Must be an address on a domain
      that has Email Routing enabled.
    - CONTACT_LIMITER rate-limit binding (skipped if absent).
*/

const DEFAULT_FROM = "contact@akramawel.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Strip CR/LF so user input can never inject extra headers.
const oneLine = (v, max) => String(v).replace(/[\r\n]+/g, " ").trim().slice(0, max);

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Hand-built MIME so no npm package is needed. Body is base64 so any
// characters / line lengths the visitor types are safe.
function buildRawEmail({ from, to, replyTo, subject, text }) {
  const domain = from.split("@")[1];
  const body = toBase64(text).match(/.{1,76}/g)?.join("\r\n") ?? "";
  return [
    `From: Portfolio Contact <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}

async function handleContact(request, env) {
  if (request.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  // Browsers always send Origin on fetch POSTs, so require it.
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return json({ success: false, message: "Forbidden" }, 403);
  }

  if (env.CONTACT_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.CONTACT_LIMITER.limit({ key: ip });
    if (!success) {
      return json(
        { success: false, message: "Too many messages. Please wait a minute and try again." },
        429
      );
    }
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

  if (!data || typeof data !== "object") {
    return json({ success: false, message: "Invalid JSON" }, 400);
  }

  // Honeypot: bots fill hidden fields, humans don't
  if (data._honey) {
    return json({ success: true });
  }

  if (!data.name || !data.email || !data.message) {
    return json({ success: false, message: "Missing fields" }, 400);
  }

  const name = oneLine(data.name, 200);
  const email = oneLine(data.email, 200);
  const message = String(data.message).trim().slice(0, 5000);

  if (!name || !message) {
    return json({ success: false, message: "Missing fields" }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ success: false, message: "Invalid email address" }, 400);
  }

  if (!env.EMAIL || !env.CONTACT_TO) {
    console.error("Contact form misconfigured: EMAIL binding or CONTACT_TO missing");
    return json({ success: false, message: "Server misconfigured" }, 500);
  }

  try {
    const from = env.CONTACT_FROM || DEFAULT_FROM;
    const raw = buildRawEmail({
      from,
      to: env.CONTACT_TO,
      replyTo: email,
      subject: "New message from akramawel.com",
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    await env.EMAIL.send(new EmailMessage(from, env.CONTACT_TO, raw));
    return json({ success: true });
  } catch (err) {
    console.error("send_email failed", err);
    return json(
      { success: false, message: "Couldn't send your message. Please try again later." },
      502
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
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