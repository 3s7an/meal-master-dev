# Import receptov z CSV

## Použitie

1. Nainštaluj závislosti: `npm install`
2. Skopíruj CSV export (napr. `recipes_rows.csv`) do projektu alebo použiť cestu ako argument.
3. Spusti:
   ```bash
   npm run import-recipes
   # alebo s cestou k CSV:
   node scripts/import-recipes-from-csv.mjs "C:\Users\Tristan\Downloads\recipes_rows.csv"
   ```
4. Skript vygeneruje súbor **`scripts/seed-recipes.sql`**.
5. Otvor [Supabase → SQL Editor](https://supabase.com/dashboard/project/ijbizqbzwitoxomuamsq/sql/new), skopíruj obsah `seed-recipes.sql` a spusti.

Recepty s `is_public = true` sa potom zobrazia vo **Feede** (ak si prihlásený a migrácie sú nasadené).

## Prečo sa recepty nezobrazujú vo Feede?

- **Musíš byť prihlásený** – Feed načítava dáta len pre prihláseného používateľa.
- **Recepty musia mať `is_public = true`** – Feed zobrazuje len verejné recepty.
- **Migrácie musia byť spustené** – v Supabase musia byť aplikované migrácie, ktoré pridávajú politiku „Anyone can view public recipes“ (súbor `20251108134422_...sql`). Ak sú staré politiky, v Table Editor → RLS skontroluj, či existuje politika na čítanie verejných receptov.
