import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/integration/**/*.test.ts", "tests/integration/**/*.test.tsx"],
  },
});