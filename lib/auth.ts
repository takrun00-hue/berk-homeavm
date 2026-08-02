import { createPool } from "@vercel/postgres";
import { randomBytes } from "crypto";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires.toISOString()})`;
  return token;
}

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  const { rows } = await pool.sql`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.token = ${token} AND sessions.expires_at > NOW()
  `;
  return rows[0] || null;
}

export async function destroySession(token: string) {
  await pool.sql`DELETE FROM sessions WHERE token = ${token}`;
}

export { pool };
