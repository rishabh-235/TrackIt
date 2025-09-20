export default {
  preset: "@babel/preset-env",
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": [
      "@babel/transformer",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },
  extensionsToTreatAsEsm: [".js"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapping: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/tests/**",
    "!src/app.js",
    "!src/db/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
};
