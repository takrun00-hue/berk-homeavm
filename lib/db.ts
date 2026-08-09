import { Pool } from "pg";

const pgPool = process.env.SUPABASE_HOST
  ? new Pool({
      host: process.env.SUPABASE_HOST,
      port: Number(process.env.SUPABASE_PORT) || 6543,
      database: process.env.SUPABASE_DATABASE || "postgres",
      user: process.env.SUPABASE_USER,
      password: process.env.SUPABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL || "").includes("localhost") ||
           (process.env.DATABASE_URL || "").includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  let text = "";
  const params: unknown[] = [];
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });
  return pgPool.query(text, params);
}

export const pool = { sql };
