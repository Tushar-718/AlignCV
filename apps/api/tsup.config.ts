import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  sourcemap: true,
  clean: true,
  // Workspace packages export raw .ts, so they must be bundled in.
  // Everything else stays external and is installed in the Docker image.
  noExternal: [/^@aligncv\//],
});
