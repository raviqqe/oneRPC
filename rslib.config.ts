import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      dts: true,
      format: "esm",
      output: {
        minify: true,
      },
    },
  ],
  source: {
    entry: {
      client: "./src/client.ts",
      index: "./src/index.ts",
    },
  },
});
