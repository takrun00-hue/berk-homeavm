import { createPool } from "@vercel/postgres";

// @vercel/postgres auto-reads POSTGRES_URL when no connectionString is passed.
// Explicitly passing undefined can prevent fallback in some versions, so we
// only pass connectionString when a value is actually present.
const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL;
export const pool = connStr ? createPool({ connectionString: connStr }) : createPool();
