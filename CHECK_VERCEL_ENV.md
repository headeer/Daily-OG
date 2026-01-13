# 🚨 Problem: DATABASE_URL nie jest w Production Environment!

## Co widzę w logach:

Po `vercel env pull .env.production --environment=production`:

**Zmiany:**
- ✅ `+ NEXTAUTH_URL` - dodany (dobrze!)
- ❌ **BRAK `DATABASE_URL` w zmianach!**

To oznacza, że **`DATABASE_URL` NIE JEST ustawiony w Production environment w Vercel!**

## Rozwiązanie:

### 1. Sprawdź w Vercel Dashboard:

1. **Vercel Dashboard** → Twój projekt → **Settings** → **Environment Variables**
2. **WAŻNE**: U góry wybierz **"Production"** (nie Development!)
3. Sprawdź czy `DATABASE_URL` istnieje:
   - Jeśli **NIE MA** → musisz go dodać
   - Jeśli **JEST** → sprawdź czy używa pooler URL

### 2. Dodaj/Zaktualizuj DATABASE_URL w Production:

1. **Supabase Dashboard** → Settings → Database
2. Connection string → Wybierz **"Transaction"**
3. Skopiuj pooler URL (powinien być z `pooler.supabase.com:6543`)

4. **Vercel** → Settings → Environment Variables → **Production**
5. Jeśli `DATABASE_URL` nie istnieje:
   - Kliknij **"Add New"**
   - Key: `DATABASE_URL`
   - Value: wklej pooler URL
   - Environment: **Production** (i Preview jeśli chcesz)
   - **Save**

6. Jeśli `DATABASE_URL` istnieje ale jest zły:
   - Kliknij **Edit** (ikona ołówka)
   - Zastąp na pooler URL
   - **Save**

### 3. Sprawdź NEXTAUTH_URL:

W Production environment powinno być:
- `NEXTAUTH_URL` = `https://daily-og.vercel.app`
- `NEXTAUTH_SECRET` = długi random string

### 4. Po zmianach - ZREDEPLOY:

1. **Deployments** tab
2. Trzy kropki (⋯) → **Redeploy**
3. **Poczekaj** na zakończenie

## Szybka weryfikacja:

W Vercel Production Environment Variables powinny być:
- ✅ `DATABASE_URL` = pooler URL (`pooler.supabase.com:6543`)
- ✅ `NEXTAUTH_URL` = `https://daily-og.vercel.app`
- ✅ `NEXTAUTH_SECRET` = random string (32+ chars)

## Jeśli nadal nie działa:

Sprawdź Vercel Function Logs:
1. **Functions** tab → `/api/auth/[...nextauth]`
2. **Logs** tab
3. Spróbuj zalogować się
4. Sprawdź błędy - powinny pokazać jaki URL próbuje użyć


