# MealMaster

Správca receptov, nákupných zoznamov a jedálničkov. Frontend (Vite + React) s backendom na Supabase.

## Lokálny vývoj

Potrebuješ Node.js a npm ([nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <URL_REPO>
cd meal-master-dev
cp .env.example .env
# Vyplň .env – hodnoty z Supabase Dashboard → Project Settings → API
npm i
npm run dev
```

## Technológie

- Vite, TypeScript, React
- shadcn/ui, Tailwind CSS
- Supabase (auth, databáza, storage)

## Nasadenie (Vercel)

1. Import repozitára vo Vercel, preset **Vite**.
2. V **Settings → Environment Variables** nastav:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - (voliteľne) `VITE_SUPABASE_PROJECT_ID`
3. Deploy.

## Náhľad odkazu (og:image)

Pre vlastný obrázok pri zdieľaní linku pridaj súbor `public/og-image.png` (odporúčaná šírka cca 1200px). V `index.html` sú meta tagy nastavené na `/og-image.png`.
