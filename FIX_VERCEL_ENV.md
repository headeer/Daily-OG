# 🚨 Problem: Pobrano zmienne z Development, nie Production!

## Co się stało:

W logach widzę:
```
> Downloading `development` Environment Variables for headeers-projects/daily-og
```

Pobrałeś zmienne z **development** environment, a potrzebujesz **production**!

## Rozwiązanie:

### 1. Pobierz zmienne z PRODUCTION environment:

```bash
vercel env pull .env.production --environment=production
```

Lub jeśli to nie działa:
```bash
vercel env pull .env.production --scope=production
```

### 2. Sprawdź co jest w Vercel Production:

1. **Vercel Dashboard** → Twój projekt → **Settings** → **Environment Variables**
2. **WAŻNE**: U góry wybierz **"Production"** (nie Development!)
3. Sprawdź `DATABASE_URL`:
   - ✅ Powinien używać `pooler.supabase.com:6543`
   - ❌ NIE powinien używać `db.*.supabase.co:5432`

### 3. Jeśli DATABASE_URL w Production jest zły:

1. **Supabase Dashboard** → Settings → Database
2. Connection string → Wybierz **"Transaction"**
3. Skopiuj pooler URL
4. **Vercel** → Settings → Environment Variables → **Production** (u góry!)
5. Znajdź `DATABASE_URL` → Edit → Wklej pooler URL
6. **Zapisz**

### 4. Sprawdź czy NEXTAUTH_URL jest w Production:

W Vercel Environment Variables (Production):
- ✅ `NEXTAUTH_URL` = `https://daily-og.vercel.app`
- ✅ `NEXTAUTH_SECRET` = długi string
- ✅ `DATABASE_URL` = pooler URL

### 5. Po zmianach - ZREDEPLOY:

1. **Deployments** tab
2. Trzy kropki (⋯) → **Redeploy**
3. **Poczekaj** na zakończenie

## Ważne różnice:

- **Development environment** = dla lokalnego developmentu
- **Production environment** = dla live aplikacji na Vercel

Aplikacja na `daily-og.vercel.app` używa **Production** environment variables!

## Szybka komenda:

```bash
# Pobierz z PRODUCTION
vercel env pull .env.production --environment=production

# Sprawdź co jest w pliku
cat .env.production | grep DATABASE_URL

# Powinno pokazać pooler URL, nie direct connection
```


