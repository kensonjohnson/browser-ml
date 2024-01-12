import { defineConfig } from "vite";
import { resolve, join } from "node:path";
import { cwd } from "node:process";
import { globSync } from "glob";

export default defineConfig({
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
