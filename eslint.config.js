import configurations from "@raviqqe/eslint-config";

export default [
  ...configurations,
  {
    files: ["src/adapters/aws-lambda.ts"],
    rules: {
      "import-x/no-unresolved": "off",
    },
  },
];
