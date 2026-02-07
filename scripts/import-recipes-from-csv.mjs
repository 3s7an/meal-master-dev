#!/usr/bin/env node
/**
 * Import receptov z CSV do Supabase.
 * Použitie: node scripts/import-recipes-from-csv.mjs [cesta/k/recipes_rows.csv]
 * Vygeneruje scripts/seed-recipes.sql – ten spusti v Supabase SQL Editore.
 * Alebo nastav SUPABASE_SERVICE_ROLE_KEY v .env a skript dáta vloží cez API (obchádza RLS).
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { parse } from "csv-parse/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = process.argv[2] || join(__dirname, "..", "recipes_rows.csv");

function escapeSql(str) {
  if (str === null || str === undefined || str === "") return null;
  return String(str).replace(/'/g, "''");
}

function toSqlValue(val) {
  if (val === null || val === undefined || val === "") return "NULL";
  const s = escapeSql(val);
  return s === null ? "NULL" : `'${s}'`;
}

try {
  const csv = readFileSync(csvPath, "utf-8");
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });

  const outPath = join(__dirname, "seed-recipes.sql");
  const lines = [
    "-- Vygenerované z " + csvPath,
    "-- Spusti v Supabase Dashboard → SQL Editor",
    "",
  ];

  for (const row of rows) {
    const id = toSqlValue(row.id);
    const user_id = toSqlValue(row.user_id);
    const name = toSqlValue(row.name);
    const description = toSqlValue(row.description);
    const category = toSqlValue(row.category);
    const ingredients = row.ingredients?.trim() ? toSqlValue(row.ingredients) : "'[]'";
    const instructions = toSqlValue(row.instructions);
    const image_url = toSqlValue(row.image_url);
    const calories = row.calories?.trim() ? toSqlValue(row.calories) : "NULL";
    const notes = toSqlValue(row.notes);
    const created_at = row.created_at?.trim() ? toSqlValue(row.created_at) : "now()";
    const updated_at = row.updated_at?.trim() ? toSqlValue(row.updated_at) : "now()";
    const is_public = String(row.is_public).toLowerCase() === "true" ? "true" : "false";

    lines.push(
      `INSERT INTO public.recipes (id, user_id, name, description, category, ingredients, instructions, image_url, calories, notes, created_at, updated_at, is_public)`,
      `VALUES (${id}::uuid, ${user_id}::uuid, ${name}, ${description}, ${category}, ${ingredients}::jsonb, ${instructions}, ${image_url}, ${calories}, ${notes}, ${created_at}::timestamptz, ${updated_at}::timestamptz, ${is_public})`,
      `ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, ingredients = EXCLUDED.ingredients, instructions = EXCLUDED.instructions, image_url = EXCLUDED.image_url, calories = EXCLUDED.calories, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at, is_public = EXCLUDED.is_public;`,
      ""
    );
  }

  writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log("OK: Vygenerovaný " + outPath + " (" + rows.length + " receptov).");
  console.log("Spusti tento súbor v Supabase Dashboard → SQL Editor.");
} catch (err) {
  console.error("Chyba:", err.message);
  if (err.code === "ENOENT") console.error("Súbor neexistuje:", csvPath);
  process.exit(1);
}
