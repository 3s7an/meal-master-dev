# Workflow: Lovable + Git + Supabase (zachovanie receptov)

## Problém

Keď robíš úpravy **v Lovable webovom rozhraní** a pushneš odtiaľ, Lovable môže prepnúť backend na **Lovable Cloud** – tam nemáš žiadne dáta, takže „stratíš“ všetky recepty.

## Riešenie: upravuj lokálne a pushuj odtiaľto

1. **Úpravy rob tu** (Cursor / lokálny editor) v tomto repozitári.
2. **Pushni zmeny na Git** (z tohto priečinka).
3. Lovable má prepojený ten istý Git – **stiahne si zmeny z repozitára** a weba bude používať **tvoj Supabase** (kde máš recepty), pokiaľ má v Lovable nastavené env premenné.

## Čo nastaviť v Lovable (raz)

Aby build z Git-u v Lovable používal tvoj Supabase projekt, treba v **Lovable** zadať env premenné:

1. Otvor svoj projekt v Lovable.
2. Choď do **Project Settings** alebo **Deployment / Build Settings** (podľa aktuálneho menu).
3. Nájdi sekciu **Environment variables** (alebo podobne).
4. Pridaj:
   - `VITE_SUPABASE_URL` = `https://ijbizqbzwitoxomuamsq.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = *anon/public kľúč* z [Supabase Dashboard → API](https://supabase.com/dashboard/project/ijbizqbzwitoxomuamsq/settings/api)

Bez týchto premenných má Lovable pri builde prázdne hodnoty a môže použiť Lovable Cloud – recepty by sa nezobrazovali.

## Odporúčaný postup

- **Lokálne (tu):** vývoj, úpravy kódu, commit + push do Git.
- **Lovable:** len na preview/deploy z Git-u; **neupravuj kód v Lovable a nepushuj odtiaľ**, aby sa ti neprepól backend na Lovable Cloud.

## Lokálny beh

V tomto projekte máš súbor `.env` (nie je v Gite) s `VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY`. Ak ešte nemáš `.env`, skopíruj `.env.example` do `.env` a doplň kľúč (viac v `HOW_TO_FIND_SUPABASE_KEYS.md`).
