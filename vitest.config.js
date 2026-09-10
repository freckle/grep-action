import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // all + include: report every src file, not just ones a test loaded
      all: true,
      include: ["src/**/*.ts"],
      // main.ts is the action entrypoint, covered by the integration CI job instead
      exclude: ["src/main.ts"],
      // No thresholds yet: coverage is reported, not gated. The template's 70%
      // thresholds arrive with the tests that meet them.
    },
  },
});
