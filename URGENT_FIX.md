# 🚨 URGENT: Fix Database Connection

Błąd nadal pokazuje direct connection URL. To oznacza, że:

## Problem: Vercel używa starej wartości DATABASE_URL

### Sprawdź w Vercel:

1. **Vercel Dashboard** → Twój projekt → **Settings** → **Environment Variables**
2. Znajdź `DATABASE_URL`
3. **Sprawdź dokładnie** co tam jest:
   - Czy na pewno używa `pooler.supabase.com`?
   - Czy na pewno używa portu `6543` (lub `5432` z `?pgbouncer=true`)?
   - Czy NIE używa `db.*.supabase.co:5432`?

### Jeśli widzisz `db.hznyjskijavihatjhhni.supabase.co:5432`:

**To jest ZŁY URL!** Musisz go zmienić:

1. **Supabase Dashboard** → Settings → Database
2. Connection string → Wybierz **"Transaction"** (NIE "Direct connection")
3. Skopiuj URL - powinien być:
   ```
   postgresql://postgres.hznyjskijavihatjhhni:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. **Vercel** → Settings → Environment Variables → `DATABASE_URL`
5. **Usuń stary** i **wklej nowy** pooler URL
6. **Zapisz**
7. **WAŻNE**: Sprawdź czy jest ustawione dla **Production** environment

### Sprawdź wszystkie środowiska:

W Vercel Environment Variables, `DATABASE_URL` powinien być ustawiony dla:
- ✅ **Production** (najważniejsze!)
- ✅ **Preview** (opcjonalnie, ale lepiej mieć)
- ✅ **Development** (opcjonalnie)

### Po zmianie - ZREDEPLOY:

1. **Deployments** tab
2. Trzy kropki (⋯) przy ostatnim deploymencie
3. **Redeploy**
4. **Poczekaj** aż się skończy (2-3 minuty)

## Jeśli nadal nie działa:

### Sprawdź czy nie ma cache:

1. Vercel Dashboard → **Deployments**
2. Kliknij na najnowszy deployment
3. Sprawdź **Build Logs**
4. Szukaj linii z `DATABASE_URL` - co tam jest?

### Wymuś nowy build:

1. Zrób małą zmianę w kodzie (np. dodaj komentarz)
2. Commit i push:
   ```bash
   git add .
   git commit -m "Force redeploy with correct DATABASE_URL"
   git push
   ```
3. To wymusi nowy build z aktualnymi env vars

### Sprawdź logi funkcji:

1. Vercel → **Functions** tab
2. Kliknij `/api/auth/[...nextauth]`
3. **Logs** tab
4. Spróbuj zalogować się
5. Sprawdź co jest w logach - jaki URL próbuje użyć?

## Najczęstsze błędy:

❌ **Zmieniono DATABASE_URL ale nie zredeployowano**
✅ **Zawsze redeploy po zmianie env vars!**

❌ **DATABASE_URL ustawiony tylko dla Preview, nie Production**
✅ **Ustaw dla Production environment!**

❌ **Użyto Session Pooler bez `?pgbouncer=true`**
✅ **Użyj Transaction Pooler (port 6543) lub Session z `?pgbouncer=true`**

## Szybki test:

W Vercel Function Logs powinieneś zobaczyć:
- ✅ `pooler.supabase.com:6543` = DOBRZE
- ❌ `db.*.supabase.co:5432` = ŹLE, zmień URL!


