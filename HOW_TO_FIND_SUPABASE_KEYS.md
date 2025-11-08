# Ako nájsť Supabase URL a API kľúče

## Krok 1: Prihláste sa do Supabase Dashboard

1. Otvorte [Supabase Dashboard](https://app.supabase.com)
2. Prihláste sa do svojho účtu
3. Vyberte váš projekt (alebo vytvorte nový)

## Krok 2: Nájdite Project URL

1. V ľavom menu kliknite na **Settings** (ikona ozubeného kolieska)
2. Kliknite na **API** v podmenu
3. V sekcii **Project URL** nájdete URL vo formáte:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
4. **Skopírujte túto URL** - toto je `VITE_SUPABASE_URL`

## Krok 3: Nájdite API Key (Anon/Public Key)

1. Na tej istej stránke (Settings > API) nájdite sekciu **Project API keys**
2. Nájdite kľúč označený ako **anon** alebo **public**
3. Kliknite na ikonu **Show** (oko) alebo **Copy** vedľa kľúča
4. **Skopírujte tento kľúč** - toto je `VITE_SUPABASE_PUBLISHABLE_KEY`

## Krok 4: Vložte hodnoty do .env súboru

1. Otvorte súbor `.env` v root adresári projektu
2. Nahraďte `your-project-id.supabase.co` skutočnou URL
3. Nahraďte `your-anon-key-here` skutočným anon kľúčom

Príklad:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Krok 5: Reštartujte server

Po uložení .env súboru:
1. Zastavte `npm run dev` (Ctrl+C)
2. Spustite znova: `npm run dev`
3. Obnovte stránku v prehliadači (F5)

## Dôležité poznámky

- **NIKDY** necommitnite `.env` súbor do Git repozitára (mal by byť v .gitignore)
- Používajte **anon/public** kľúč, NIE **service_role** kľúč (ten je pre server-side)
- Po zmene .env súboru MUSÍTE reštartovať dev server

## Overenie

Po nastavení mali by ste vidieť:
- Vaše tabuľky v aplikácii
- Vašich používateľov
- Vaše recepty
- Bucket `recipe-images` (ak ho vytvoríte v tomto projekte)

