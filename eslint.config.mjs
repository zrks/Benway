import eslintJs from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.es2021,
      },
    },
    plugins: {},
    rules: {
      ...eslintJs.configs.recommended.rules,
      "no-console": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off"
    },
  },
];
