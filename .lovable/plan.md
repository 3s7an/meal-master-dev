
# Import receptov z CSV do Lovable Cloud

## Prehled

CSV subor obsahuje priblizne 50 receptov od dvoch pouzivatelov. Vsetky recepty sa priradia novemu uctu "Alexandra Prekopova".

## Kroky

### 1. Registracia noveho pouzivatela
Pred importom je potrebne vytvorit ucet pre Alexandru Prekopovu:
- Zaregistruj sa v aplikacii cez stranku /auth s menom "Alexandra Prekopova"
- Po registracii sa vytvori profil v databaze s novym user_id

### 2. Vytvorenie edge funkcie na import CSV
Vytvorim backend funkciu `import-recipes`, ktora:
- Prijme CSV data cez POST request
- Rozparsuje kazdy riadok a extrahuje: name, description, category, ingredients, instructions, image_url, calories, notes, is_public
- Priradi vsetky recepty k zadanemu user_id (Alexandra)
- Vlozi recepty do tabulky `recipes` po davkach

### 3. Vytvorenie importnej stranky v aplikacii
Vytvorim jednoduchu stranku/komponent, ktory:
- Umozni nahrat CSV subor
- Zavola edge funkciu na import
- Zobrazi priebeh a vysledok importu

## Dolezite poznamky

- **Obrazky receptov**: URL adresy obrazkov v CSV odkazuju na stary Supabase projekt (ijbizqbzwitoxomuamsq). Tieto URL budeme importovat ako su - budu fungovat pokial stary projekt zostane aktivny. Ak chces obrazky presunout, bude to vyzadovat dalsiu pracu.
- **Kategorie**: CSV pouziva spravne slovenske kategorie (ranajky, polievka, hlavne_jedlo, vecera, snack), takze nie je potrebna konverzia.
- **Duplicity**: Existujuce 2 recepty v databaze (Kolozvarska kapusta, Bolognske spagety) zostanu nezmenene. Nove recepty budu pridane s novymi ID.

## Technicke detaily

### Edge funkcia `import-recipes`
```
POST /import-recipes
Body: { user_id: string, recipes: Array<recipe CSV row> }
```

Funkcia:
- Validuje vstupne data
- Normalizuje kategorie cez existujucu logiku
- Generuje nove UUID pre kazdy recept
- Pouziva service role key na vkladanie dat (obchadzajuc RLS)

### Parsing CSV
- CSV obsahuje viacriadkove instrukcie (obalene v uvodzovkach)
- Ingredients su JSON pole v stlpci
- Prazdne hodnoty pre calories a notes treba spracovat ako NULL
