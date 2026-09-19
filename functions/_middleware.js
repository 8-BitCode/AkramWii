const BASE_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'; upgrade-insecure-requests";

const GAME_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'";

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const headers = new Headers(response.headers);

  const isGame = url.pathname === "/portfolio.html";

  headers.set("Content-Security-Policy", isGame ? GAME_CSP : BASE_CSP);
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}