/**
 * BUENO — static server for Railway (and local dev).
 *
 * Clean URLs so the text-back link reads like a real product:
 *   /                  the pitch page sellers send to businesses
 *   /b/<slug>          a client's customer page  (the link in the text)
 *   /signup            2-minute business signup
 *   /partners          seller recruiting page
 *   /report            monthly rescued-calls report builder
 *   /demo              the sample shop, for demos
 *
 * No dependencies — plain Node. `node server.js` locally, Railway runs it too.
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Friendly path -> real file
const ROUTES = {
  "/": "rescue-pitch.html",
  "/signup": "signup.html",
  "/partners": "rescue-partners.html",
  "/report": "report.html",
  "/privacy": "privacy.html",
  "/terms": "terms.html",
  "/messaging": "messaging.html",
  "/newclient": "newclient.html",
  "/demo": "rescue-demo.html",
};

const send = (res, code, body, type) => {
  res.writeHead(code, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
};

/* =============================================================================
   REQUEST RELAY — a customer taps a button, the shop owner's phone buzzes.

   Owner phone numbers are deliberately NOT in shops.js: that file is public.
   They live in one Railway environment variable instead:

     SHOP_ROUTING = {"marinos-auto":{"owner":"+12145550187","from":"+12145550142"}}
     TWILIO_ACCOUNT_SID = AC...
     TWILIO_AUTH_TOKEN  = (never in the repo, never in the browser)

   Set those three in Railway -> Variables. Nothing secret is ever committed.
   ============================================================================= */

const routing = (() => {
  try { return JSON.parse(process.env.SHOP_ROUTING || "{}"); }
  catch (e) { console.error("SHOP_ROUTING is not valid JSON — relay disabled"); return {}; }
})();

const sendSMS = (to, from, body) =>
  new Promise((resolve, reject) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return reject(new Error("Twilio credentials not set"));

    const payload = new URLSearchParams({ To: to, From: from, Body: body }).toString();
    const request = https.request(
      {
        hostname: "api.twilio.com",
        path: `/2010-04-01/Accounts/${sid}/Messages.json`,
        method: "POST",
        auth: `${sid}:${token}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (r) => {
        let data = "";
        r.on("data", (c) => (data += c));
        r.on("end", () => (r.statusCode < 300 ? resolve(data) : reject(new Error(`Twilio ${r.statusCode}: ${data}`))));
      }
    );
    request.on("error", reject);
    request.write(payload);
    request.end();
  });

// What the owner reads on their phone. Short — they're working.
const alertText = (kind, d) => {
  const who = d.name ? `${d.name} ` : "";
  if (kind === "book") return `BUENO — ${who}wants ${d.when || "a slot"}${d.staff ? ` with ${d.staff}` : ""}. Call back: ${d.phone || "no number given"}`;
  if (kind === "callback") return `BUENO — ${who}asked for a callback ${d.when || "as soon as you can"}. ${d.note ? `"${d.note}" ` : ""}Number: ${d.phone || "not given"}`;
  if (kind === "quote") return `BUENO — quote request${d.name ? ` from ${d.name}` : ""}: "${d.note || ""}" Number: ${d.phone || "not given"}`;
  return `BUENO — new request from your page. Number: ${d.phone || "not given"}`;
};

const readBody = (req, limit = 8000) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > limit) { reject(new Error("payload too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch (e) { reject(new Error("bad JSON")); }
    });
    req.on("error", reject);
  });

const handleRequest = async (req, res) => {
  let body;
  try { body = await readBody(req); }
  catch (e) { return send(res, 400, JSON.stringify({ ok: false, error: "bad request" }), TYPES[".json"]); }

  const slug = String(body.slug || "").slice(0, 60);
  const kind = String(body.kind || "").slice(0, 20);
  const shop = routing[slug];

  // Always log it, even if the text fails — a request must never vanish.
  console.log(`[request] ${new Date().toISOString()} ${slug} ${kind} ${JSON.stringify(body.details || {})}`);

  if (!shop || !shop.owner || !shop.from) {
    return send(res, 200, JSON.stringify({ ok: false, error: "not routed" }), TYPES[".json"]);
  }

  try {
    await sendSMS(shop.owner, shop.from, alertText(kind, body.details || {}));
    send(res, 200, JSON.stringify({ ok: true }), TYPES[".json"]);
  } catch (err) {
    console.error("[relay failed]", err.message);
    send(res, 200, JSON.stringify({ ok: false, error: "relay failed" }), TYPES[".json"]);
  }
};

const serveFile = (res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, data, TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
};

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch (e) {
      return send(res, 400, "Bad request");
    }

    // Customer taps a button on a shop page -> owner gets a text.
    if (req.method === "POST" && pathname === "/api/request") return handleRequest(req, res);

    // /b/<slug> — every client page is the same file; b.html reads the slug.
    if (pathname === "/b" || pathname.startsWith("/b/")) {
      return serveFile(res, path.join(ROOT, "b.html"));
    }

    if (ROUTES[pathname]) return serveFile(res, path.join(ROOT, ROUTES[pathname]));

    // Plain static, with a guard so nobody can walk out of the folder.
    const target = path.normalize(path.join(ROOT, pathname));
    if (!target.startsWith(ROOT)) return send(res, 403, "Forbidden");

    fs.stat(target, (err, stat) => {
      if (err || stat.isDirectory()) return send(res, 404, "Not found");
      serveFile(res, target);
    });
  })
  .listen(PORT, () => console.log("Bueno running on http://localhost:" + PORT));
