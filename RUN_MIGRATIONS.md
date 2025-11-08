# Spustenie migrácií v Supabase

Keďže teraz používate nový Supabase projekt, musíte spustiť všetky migrácie v správnom poradí.

## Postup

1. Otvorte **Supabase Dashboard** → váš projekt
2. Prejdite na **SQL Editor** v ľavom menu
3. Spustite migrácie v tomto poradí (každú samostatne):

### Migrácia 1: Základná štruktúra
**Súbor**: `supabase/migrations/20251101183410_603cf295-3972-478a-bb51-e2a4397ab88e.sql`

Táto migrácia vytvorí:
- Tabuľku `profiles`
- Tabuľku `recipes`
- Tabuľku `meal_plans`
- Tabuľku `shopping_list`
- Všetky základné RLS policies
- Triggers a funkcie

**Skopírujte celý obsah súboru a spustite v SQL Editori**

### Migrácia 2: Oprava meal_plans
**Súbor**: `supabase/migrations/20251103194603_05e6642c-03dc-4976-9e47-eb4703896d3f.sql`

Táto migrácia upravuje constraint na `meal_plans`.

**Skopírujte celý obsah súboru a spustite**

### Migrácia 3: Verejné recepty a likes
**Súbor**: `supabase/migrations/20251108134422_d8f1e986-acea-49a3-8821-70b4e5c003d1.sql`

Táto migrácia vytvorí:
- Stĺpec `is_public` v `recipes`
- Tabuľku `recipe_likes`
- Tabuľku `saved_recipes`
- Policies pre verejné recepty

**Skopírujte celý obsah súboru a spustite**

### Migrácia 4: Zobrazenie autorov receptov
**Súbor**: `supabase/migrations/20251108173713_allow_view_recipe_authors.sql`

Táto migrácia umožňuje zobrazenie mien autorov verejných receptov.

**Skopírujte celý obsah súboru a spustite**

### Migrácia 5: Storage bucket pre obrázky
**Súbor**: `supabase/migrations/20251108175755_create_recipe_images_bucket.sql`

**POZOR**: Táto migrácia môže zlyhať kvôli oprávneniam. Ak zlyhá, vytvorte bucket manuálne:
1. Storage → Buckets → New bucket
2. Name: `recipe-images`
3. Public: ✅
4. File size limit: `5242880` (5MB)
5. Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

Potom vytvorte policies cez Storage → Policies (alebo použite `setup_storage_policies.sql`)

## Overenie

Po spustení všetkých migrácií skontrolujte:

1. **Tables** → mali by ste vidieť:
   - `profiles`
   - `recipes`
   - `meal_plans`
   - `shopping_list`
   - `recipe_likes`
   - `saved_recipes`

2. **Storage** → mali by ste vidieť bucket `recipe-images`

3. **Authentication** → skúste sa prihlásiť/registrovať

## Dôležité

- Spúšťajte migrácie v správnom poradí (podľa dátumov v názvoch)
- Ak niektorá migrácia zlyhá, pozrite sa na chybovú správu
- Po spustení migrácií reštartujte aplikáciu (`npm run dev`)

