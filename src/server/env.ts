import { z } from "zod";

const envSchema = z.object({
  SRM_SESSION_KEY: z
    .string()
    .min(32, "SRM_SESSION_KEY must be at least 32 characters"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

let _validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (_validatedEnv) return _validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `  ${path}: ${issue.message}`;
      })
      .join("\n");

    console.error("\n========================================");
    console.error("SERVER_CONFIG_MISSING: Required environment variables are missing or invalid:");
    console.error(missing);
    console.error("");
    console.error("To generate SRM_SESSION_KEY, run:");
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error("========================================\n");

    throw new Error(
      `SERVER_CONFIG_MISSING: Missing required environment variables.\n${missing}`
    );
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}

export function getEncryptionKey(): Buffer {
  const env = getEnv();
  const key = Buffer.alloc(32);
  Buffer.from(env.SRM_SESSION_KEY, "utf8").copy(key);
  return key;
}
