import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/loadTestEnv.ts", "./src/test/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
});
