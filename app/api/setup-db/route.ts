import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pool.sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await pool.sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL
    )
  `;

  await pool.sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE
    )
  `;

  await pool.sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_tr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `;

  await pool.sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_tr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price_min INTEGER NOT NULL,
      price_max INTEGER NOT NULL,
      image TEXT NOT NULL,
      description_tr TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `;

  // seed categories (only if table is empty)
  const catCount = await pool.sql`SELECT COUNT(*) FROM categories`;
  if (Number(catCount.rows[0].count) === 0) {
    await pool.sql`
      INSERT INTO categories (slug, name_tr, name_en, sort_order) VALUES
      ('sofa-set', 'Koltuk Takımı', 'Sofa Set', 1),
      ('bedroom', 'Yatak Odası', 'Bedroom', 2),
      ('dining-room', 'Yemek Odası', 'Dining Room', 3),
      ('corner-set', 'Köşe Takımı', 'Corner Set', 4),
      ('tv-unit', 'TV Ünitesi', 'TV Unit', 5),
      ('sets', 'Setler', 'Sets', 6)
    `;
  }

  // seed products (only if table is empty)
  const prodCount = await pool.sql`SELECT COUNT(*) FROM products`;
  if (Number(prodCount.rows[0].count) === 0) {
    await pool.sql`
      INSERT INTO products (slug, name_tr, name_en, category_id, price_min, price_max, image, description_tr, description_en, sort_order) VALUES
      ('zenith-sofa-set', 'Zenith Koltuk Takımı', 'Zenith Sofa Set', (SELECT id FROM categories WHERE slug='sofa-set'), 45000, 58000, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800', 'Modern tasarım ve kaliteli kumaşla üretilmiş konforlu koltuk takımı.', 'Comfortable sofa set crafted with modern design and premium fabric.', 1),
      ('bohem-sofa-set', 'Bohem Koltuk Takımı', 'Bohem Sofa Set', (SELECT id FROM categories WHERE slug='sofa-set'), 45000, 58000, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', 'Sıcak ve samimi tasarım, ahşap ayaklar ve renkli yastıklar.', 'Warm and cozy design with wooden legs and colorful cushions.', 2),
      ('lumiera-sofa-set', 'Lumiera Koltuk Takımı', 'Lumiera Sofa Set', (SELECT id FROM categories WHERE slug='sofa-set'), 54000, 61000, 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800', 'Toprak tonları ve ince metal ayaklarla şık bir kombinasyon.', 'A stylish combination of earth tones and slim metal legs.', 3),
      ('valens-sofa-set', 'Valens Koltuk Takımı', 'Valens Sofa Set', (SELECT id FROM categories WHERE slug='sofa-set'), 51000, 58000, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', 'Minimal tasarım, rahat minderler ve bej kumaş.', 'Minimal design with comfortable cushions and beige fabric.', 4),
      ('zeus-corner-set', 'Zeus Köşe Takımı', 'Zeus Corner Set', (SELECT id FROM categories WHERE slug='corner-set'), 52000, 59990, 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', 'Aile alanları için büyük köşe kanepe.', 'Large corner sofa ideal for family spaces.', 5),
      ('noir-bed', 'Noir Yatak', 'Noir Bed', (SELECT id FROM categories WHERE slug='bedroom'), 32000, 41000, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', 'Depolama çekmeceli ve gizli aydınlatmalı yatak.', 'Bed with storage drawer and hidden lighting.', 6),
      ('orion-dining-table', 'Orion Yemek Masası', 'Orion Dining Table', (SELECT id FROM categories WHERE slug='dining-room'), 18000, 24000, 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=800', 'Suni mermer kaplamalı ahşap yemek masası.', 'Wooden dining table with faux marble finish.', 7),
      ('atlas-tv-unit', 'Atlas TV Ünitesi', 'Atlas TV Unit', (SELECT id FROM categories WHERE slug='tv-unit'), 12000, 16000, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', 'İç depolama alanına sahip modern TV ünitesi.', 'Modern TV unit with internal storage space.', 8)
    `;
  }

  return NextResponse.json({ success: true, message: "Tablolar hazır." });
}
