import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  { ignores: ["**/.next/**", "**/node_modules/**", "supabase/scripts/**", "lib/mock-data.ts"] },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...(tsPlugin.configs.recommended?.rules ?? {}),
      ...(reactPlugin.configs.recommended?.rules ?? {}),
      ...(reactHooksPlugin.configs.recommended?.rules ?? {}),
      ...(nextPlugin.configs["core-web-vitals"]?.rules ?? {}),
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
]
