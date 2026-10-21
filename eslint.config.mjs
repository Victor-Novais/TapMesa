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
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
