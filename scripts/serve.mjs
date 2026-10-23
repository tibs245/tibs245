import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";

export function serve(port = 4174) {
  const root = resolve("docs");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8",
  };
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      // Mirror the public project path as well as the local root.
      const relative =
        pathname.replace(/^\/tibs245(?=\/|$)/, "").replace(/^\//, "") ||
        "index.html";
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => done(server));
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await serve(Number(process.env.PORT || 4174));
  console.log(
    `Portfolio: http://127.0.0.1:${process.env.PORT || 4174}/tibs245/`,
  );
}
