import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Logger isn't configured yet (it depends on env), so write directly.
    // Only variable names and issues are printed, never values.
    console.error("Invalid environment configuration:", z.treeifyError(result.error));
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
