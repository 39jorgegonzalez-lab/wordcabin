import { defineConfig } from "vite";
import fs from "node:fs";

// Public SEO pages retain their HTML/content while using the same dev bootstrap.
const toolPages = {
  name: "wordcabin-tool-pages",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (!/^\/(anagram-solver|scrabble-word-finder)\/?$/.test(pathname)) return next();
      try {
        const route = pathname.replace(/^\/|\/$/g, "");
        const source = fs.readFileSync(new URL(`./public/${route}/index.html`, import.meta.url), "utf8");
        const html = await server.transformIndexHtml(pathname, source.replace("<!-- TOOL_ASSETS -->", '<script type="module" src="/src/main.jsx"></script>'));
        response.setHeader("Content-Type", "text/html");
        response.end(html);
      } catch (error) { next(error); }
    });
  },
};

export default defineConfig({
  plugins: [toolPages],
  build: {
    manifest: true,
  },
});
