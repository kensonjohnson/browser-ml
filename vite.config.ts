import { defineConfig } from "vite";
import { resolve, join } from "node:path";
import { cwd } from "node:process";
import { globSync } from "glob";

let baseUrl = "/";

if (process.env.NODE_ENV === "production") {
  baseUrl = "/" + (cwd().split("/").pop() || "");
}

export default defineConfig({
  base: baseUrl,
  root: join(cwd(), "src"),
  publicDir: join(cwd(), "public"),
  build: {
    outDir: join(cwd(), "build"),
    emptyOutDir: true,
    rollupOptions: {
      input: globSync(resolve(cwd(), "src", "**/*.html")),
    },
  },
});
