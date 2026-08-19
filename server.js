const http = require("http");
const fs = require("fs");
const path = require("path");
const { answer } = require("./prism-engine");
const { searchScience } = require("./scholar-search");
const root = __dirname;
const port = Number(process.env.PORT || 3000);

function json(res, status, payload) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(payload)); }

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/status") return json(res, 200, { online: true, name: "Helix Science", mode: "Scientific research workspace" });
  if (req.method === "POST" && req.url === "/api/local") {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 100000) req.destroy(); });
    req.on("end", () => { try { const { message } = JSON.parse(raw); if (typeof message !== "string" || !message.trim()) return json(res, 400, { error: "Please enter a scientific question." }); return json(res, 200, { text: answer(message.trim()) }); } catch { return json(res, 400, { error: "Invalid request." }); } });
    return;
  }
  if (req.method === "POST" && req.url === "/api/chat") {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 100000) req.destroy(); });
    req.on("end", async () => {
      try {
        const { message } = JSON.parse(raw);
        if (typeof message !== "string" || !message.trim()) return json(res, 400, { error: "Please enter a scientific question." });
        const sources = await searchScience(message.trim());
        const local = answer(message.trim());
        const text = local.startsWith("I don’t have enough")
          ? "I found relevant scientific literature. Review the cited research below; search results alone are not proof of a conclusion."
          : local;
        return json(res, 200, { text, sources });
      } catch (error) {
        return json(res, 200, { text: "I couldn’t retrieve scholarly records for this question right now, so I’m not going to invent an answer. Try again shortly or use a more specific scientific question.", sources: [], notice: `Live research is temporarily unavailable: ${error.message}` });
      }
    });
    return;
  }
  const filename = req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1));
  const filePath = path.resolve(root, filename);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
  const type = filename.endsWith(".css") ? "text/css" : filename.endsWith(".js") ? "application/javascript" : "text/html";
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }); fs.createReadStream(filePath).pipe(res);
}).listen(port, "0.0.0.0", () => console.log(`Helix AI running at http://localhost:${port}`));
