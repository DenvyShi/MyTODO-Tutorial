#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = 3002;
const API_PORT = 3001;
const distDir = path.join(__dirname, "src/client/dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // Proxy /api requests to the backend server
  if (req.url.startsWith("/api")) {
    const options = {
      hostname: "localhost",
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: "localhost:" + API_PORT },
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxy.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backend unavailable" }));
    });

    req.pipe(proxy);
    return;
  }

  // Serve static files
  let filePath = path.join(distDir, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(distDir, "index.html"), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, {"Content-Type": contentType});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("Tutorial server on port " + PORT + " (API proxy -> " + API_PORT + ")");
});
