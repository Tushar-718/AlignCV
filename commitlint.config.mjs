// Mirrors the git conventions in .claude/rules/general.md.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "test", "docs", "chore", "ci", "build", "perf"],
    ],
    "scope-enum": [2, "always", ["api", "web", "shared", "db", "infra", "docs"]],
    "scope-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
  },
};
