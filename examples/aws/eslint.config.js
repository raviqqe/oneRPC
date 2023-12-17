import configurations from "@raviqqe/eslint-config";

export default [
  ...configurations,
  {
    rules: {
      "import/extensions": "off",
    },
  },
];
