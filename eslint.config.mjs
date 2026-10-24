import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        {
          type: "app",
          pattern: "src/app/**",
          partialMatch: false,
        },
        {
          type: "feature",
          pattern: "src/features/*",
        },
        {
          type: "shared-ui",
          pattern: "src/shared/ui/**",
          partialMatch: false,
        },
        {
          type: "shared-other",
          pattern: "src/shared/!(ui)/**",
          partialMatch: false,
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: [
                { to: { element: { type: ["app", "feature", "shared-ui", "shared-other"] } } },
              ],
            },
            {
              from: { element: { type: "feature" } },
              allow: [
                { to: { element: { type: ["feature", "shared-ui", "shared-other"] } } },
              ],
            },
            {
              from: { element: { type: "shared-ui" } },
              allow: [
                { to: { element: { type: ["shared-ui", "shared-other"] } } },
              ],
            },
            {
              from: { element: { type: "shared-other" } },
              allow: [
                { to: { element: { type: ["shared-other"] } } },
              ],
            },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "allow",
          policies: [
            {
              target: { element: { type: "feature" } },
              disallow: "!index.*",
            },
          ],
        },
      ],
    },
  },
  // Cores só pelos tokens do design (globals.css). Paleta crua do Tailwind quebra o
  // tema escuro e a personalização (DESIGN_PLAN Q10). O cartão de impressão fica de
  // fora: é papel, sempre preto sobre branco.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/tables/ui/table-print-card.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/\\b(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|fill|stroke|from|via|to|divide|outline|placeholder|decoration|accent|caret|shadow)-(?:zinc|slate|gray|neutral|stone|orange|red|rose|amber|yellow|emerald|green|blue|sky|indigo|violet|purple|teal|cyan|lime|pink|fuchsia)-\\d{2,3}\\b/]",
          message:
            "Use os tokens do design (bg-surface, text-ink, bg-danger-tint…) em vez da paleta crua do Tailwind.",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|fill|stroke|from|via|to|divide|outline|placeholder|decoration|accent|caret|shadow)-(?:zinc|slate|gray|neutral|stone|orange|red|rose|amber|yellow|emerald|green|blue|sky|indigo|violet|purple|teal|cyan|lime|pink|fuchsia)-\\d{2,3}\\b/]",
          message:
            "Use os tokens do design (bg-surface, text-ink, bg-danger-tint…) em vez da paleta crua do Tailwind.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
