import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/security/**/*.{test,spec}.{ts,tsx}",
      "tests/components/**/*.{test,spec}.{ts,tsx}",
    ],
    setupFiles: ["./tests/setup.ts", "./tests/unit/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "tests/setup.ts",
        "tests/unit/setup.ts",
        "**/*.test.ts",
        "**/*.d.ts",
        "drizzle/**",
        "scripts/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
