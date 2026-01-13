# Update DATABASE_URL in Vercel Production

## Status Check:

✅ `DATABASE_URL` **JEST** w Production environment
✅ `NEXTAUTH_URL` **JEST** w Production environment  
✅ `NEXTAUTH_SECRET` **JEST** w Production environment

## Problem:

`DATABASE_URL` prawdopodobnie używa **direct connection URL** zamiast **pooler URL**.

## Rozwiązanie - Krok po kroku:

### 1. Pobierz Pooler URL z Supabase:

1. **Supabase Dashboard** → Settings → Database
2. Scroll do **"Connection string"**
3. **WAŻNE**: W dropdown wybierz **"Transaction"** (NIE "Direct connection")
4. Skopiuj **URI** format - powinien wyglądać tak:
   ```
   postgresql://postgres.hznyjskijavihatjhhni:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   (Zauważ: `pooler.supabase.com` i port `6543`)

### 2. Zaktualizuj w Vercel:

1. **Vercel Dashboard** → Twój projekt → **Settings** → **Environment Variables**
2. **WAŻNE**: U góry wybierz **"Production"** (nie Development!)
3. Znajdź `DATABASE_URL`
4. Kliknij **Edit** (ikona ołówka)
5. **Zastąp** całą wartość pooler URL z Supabase
6. Sprawdź czy **Environment** to **Production** (i Preview jeśli chcesz)
7. Kliknij **Save**

### 3. Sprawdź format URL:

**Poprawny (pooler):**
```
postgresql://postgres.hznyjskijavihatjhhni:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Błędny (direct connection):**
```
postgresql://postgres:[PASSWORD]@db.hznyjskijavihatjhhni.supabase.co:5432/postgres
```

**Różnice:**
- ✅ `pooler.supabase.com` vs ❌ `db.*.supabase.co`
- ✅ Port `6543` vs ❌ Port `5432`
- ✅ `aws-0-[REGION]` w hostname

### 4. ZREDEPLOY:

**BARDZO WAŻNE**: Po zmianie environment variable:

1. **Deployments** tab
2. Kliknij **trzy kropki** (⋯) przy ostatnim deploymencie
3. Kliknij **Redeploy**
4. **Poczekaj** aż się skończy (2-3 minuty)

Environment variables są ładowane tylko podczas builda, więc **musisz zredeployować**!

### 5. Sprawdź czy działa:

1. Poczekaj na zakończenie redeploy
2. Idź na https://daily-og.vercel.app/auth/signin
3. Spróbuj zalogować się
4. Jeśli nadal błąd, sprawdź **Vercel Function Logs**:
   - Functions → `/api/auth/[...nextauth]` → Logs
   - Sprawdź jaki URL próbuje użyć

## Alternatywa: Użyj Vercel CLI

Jeśli wolisz z CLI:

```bash
# Usuń stary (opcjonalnie)
vercel env rm DATABASE_URL production

# Dodaj nowy z pooler URL
vercel env add DATABASE_URL production
# Wklej pooler URL gdy zapyta
```

Potem zredeployuj w dashboard.

## Checklist:

- [ ] Pobrano pooler URL z Supabase (Transaction mode)
- [ ] Zaktualizowano `DATABASE_URL` w Vercel Production
- [ ] URL używa `pooler.supabase.com:6543` (nie `db.*.supabase.co:5432`)
- [ ] Zredeployowano aplikację w Vercel
- [ ] Sprawdzono czy login działa


