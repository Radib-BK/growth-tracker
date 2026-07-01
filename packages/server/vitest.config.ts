import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one real Postgres database and clean up
    // test rows between tests, so test files must not run concurrently.
    fileParallelism: false,
  },
});
