import nextJsConfig from "eslint-config-next";

const augmentedNextConfig = nextJsConfig.map((config) => {
  if (config.name === "next/typescript") {
    return {
      ...config,
      rules: {
        ...config.rules,
        "require-await": "error",
      },
    };
  }

  if (config.name === "next") {
    return {
      ...config,
      rules: {
        ...config.rules,
        "@next/next/no-img-element": "error",
      },
    };
  }

  return config;
});

/** @type {import("eslint").Linter.Config} */
const config = [
  ...augmentedNextConfig,
  {
    ignores: ["coverage/**", "out/**", "build/**"],
  },
];

export default config;
