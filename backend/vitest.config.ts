import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/loadTestEnv.ts", "./src/test/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/test/**",
        "src/index.ts",
        "src/types/**",
      ],
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
});
