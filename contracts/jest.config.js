/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.spec.ts"],
    testTimeout: 60000,
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    },
};
