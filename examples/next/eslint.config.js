import configurations from "@raviqqe/eslint-config";

export default [
  ...configurations,
  {
    files: ["src/app/**/{layout,page}.ts{,x}", "src/pages/api/**/*.ts"],
    rules: {
      "import-x/no-default-export": "off",
      "react/display-name": "off",
    },
  },
];
