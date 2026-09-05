import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// No @vitejs/plugin-react: its current release needs Babel 8, which conflicts
// with Next's Babel 7. Vitest 5 transforms TSX on its own.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
