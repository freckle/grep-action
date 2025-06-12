/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(minimatch|brace-expansion|balanced-match)/)",
  ],
};
