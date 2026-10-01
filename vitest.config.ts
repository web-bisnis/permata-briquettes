import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["worker/tests/**/*.test.ts", "tests/**/*.test.{mjs,ts}"],
    fileParallelism: false,
    coverage: { enabled: false },
  },
});
