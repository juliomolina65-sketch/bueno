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
  "/demo": "rescue-demo.html",
};

const send = (res, code, body, type) => {
  res.writeHead(code, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
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
