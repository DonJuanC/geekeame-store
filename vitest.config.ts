import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Config de test separada de vite.config.ts: así los ajustes propios de
// testing (jsdom, setupFiles, coverage) nunca se filtran al build de
// producción que corre `vite build`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["src/test/**", "**/*.test.ts", "**/*.test.tsx", "src/main.tsx"],
    },
  },
});
