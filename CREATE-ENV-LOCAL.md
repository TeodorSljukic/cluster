# Kako da kreiraš .env.local fajl za lokalni development

## Korak 1: Kreiraj .env.local fajl

U root folderu projekta (gde je `package.json`), kreiraj fajl sa imenom `.env.local`

## Korak 2: Dodaj environment varijable

Kopiraj sledeći sadržaj u `.env.local` fajl:

```env
# MongoDB Connection (koristi istu kao na Vercel-u)
MONGODB_URI="mongodb+srv://teodorsljukic_db_user:OD83n5B45mY1OH7v@cluster.mongodb.net/abgc?retryWrites=true&w=majority"
MONGODB_DB="abgc"

# JWT Secret (koristi isti kao na Vercel-u)
JWT_SECRET="1840634288a471935f0b9dd9cb4015adcfd241646a5c54bf1d988e87"

# Public Base URL (za lokalni development)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Korak 3: Restart development servera

Nakon kreiranja `.env.local` fajla:

1. Zaustavi development server (Ctrl+C u terminalu)
2. Pokreni ponovo: `npm run dev`
3. Otvori `http://localhost:3000` u browseru

## VAŽNO:

- `.env.local` fajl se NE commit-uje u Git (već je u `.gitignore`)
- Koristi iste vrednosti kao na Vercel-u za MongoDB i JWT_SECRET
- NEXT_PUBLIC_BASE_URL mora biti `http://localhost:3000` za lokalni development

## Troubleshooting:

### Problem: "Missing MONGODB_URI"
**Rešenje:** Proveri da li je `.env.local` fajl u root folderu projekta (gde je `package.json`)

### Problem: "MongoDB connection error"
**Rešenje:** 
- Proveri da li imaš internet konekciju
- Proveri da li je MongoDB Atlas whitelist dozvoljava tvoju IP adresu (ili koristi `0.0.0.0/0` za sve IP adrese)

### Problem: Server se ne pokreće
**Rešenje:**
- Proveri da li je port 3000 zauzet: `netstat -ano | findstr :3000`
- Ako je zauzet, zatvori proces ili promeni port u `package.json`
