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
      "adapter/aws-lambda": "./src/adapter/aws-lambda.ts",
      client: "./src/client.ts",
      index: "./src/index.ts",
      middleware: "./src/middleware.ts",
      validation: "./src/validation.ts",
    },
  },
});
