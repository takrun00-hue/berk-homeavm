import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    SUPABASE_HOST: process.env.SUPABASE_HOST || "NOT SET",
    SUPABASE_USER: process.env.SUPABASE_USER || "NOT SET",
    SUPABASE_PORT: process.env.SUPABASE_PORT || "NOT SET",
    SUPABASE_DATABASE: process.env.SUPABASE_DATABASE || "NOT SET",
    SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD ? "SET" : "NOT SET",
    DATABASE_URL_starts: process.env.DATABASE_URL?.substring(0, 30) || "NOT SET",
    PGUSER: process.env.PGUSER || "NOT SET",
  });
}
