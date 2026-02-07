#!/usr/bin/env node
/**
 * Spočíta recepty v tabuľke recipes (Supabase z .env).
 * Spustenie: node scripts/count-recipes.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");

function loadEnv() {
  const env = {};
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      env[key] = val;
    }
  } catch (e) {
    console.error("Chyba: .env neexistuje alebo sa nedá čítať.", e.message);
    process.exit(1);
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Chyba: V .env chýbajú VITE_SUPABASE_URL alebo VITE_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

const { count, error } = await supabase
  .from("recipes")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error("Chyba Supabase:", error.message);
  process.exit(1);
}

console.log("Počet receptov v tabuľke recipes:", count ?? 0);
