import { sql } from "@vercel/postgres";

// Use the sql tagged template directly instead of createPool().
// createPool() throws at import time if POSTGRES_URL is not set,
// which crashes the Next.js build. sql connects lazily on first query.
export const pool = { sql };
