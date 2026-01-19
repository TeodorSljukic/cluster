# Kako da importuješ .env fajl na Vercel

## Korak 1: Kreiraj .env fajl

Fajl `.env` je već kreiran u root folderu projekta sa sledećim sadržajem:

```
MONGODB_URI=mongodb+srv://teodorsljukic_db_user:OD83n5B45mY1OH7v@cluster.mongodb.net/abgc?retryWrites=true&w=majority
MONGODB_DB=abgc
JWT_SECRET=1840634288a471935f0b9dd9cb4015adcfd241646a5c54bf1d988e87
NODE_ENV=production
```

## Korak 2: Import na Vercel

### Opcija A: Import tokom kreiranja projekta

1. Na Vercel "New Project" stranici, proširi **"Environment Variables"** sekciju
2. Klikni na **"Import .env"** dugme (sa ikonom dokumenta)
3. Izaberi `.env` fajl sa tvog kompjutera
4. Vercel će automatski učitati sve varijable
5. Proveri da li su sve varijable učitane
6. Klikni **"Deploy"**

### Opcija B: Import posle kreiranja projekta

Ako si već kreirao projekat:

1. Idite na **Project Settings** → **Environment Variables**
2. Klikni na **"Import .env"** dugme
3. Izaberi `.env` fajl
4. Vercel će automatski učitati sve varijable
5. Klikni **"Redeploy"** da primeniš promene

## Format .env fajla

`.env` fajl treba da izgleda ovako (bez navodnika oko vrednosti):

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/abgc?retryWrites=true&w=majority
MONGODB_DB=abgc
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

**VAŽNO:**
- Ne stavljaj navodnike oko vrednosti (osim ako vrednost sama sadrži razmake)
- Jedna varijabla po liniji
- Format: `KEY=value`
- Prazne linije se ignorišu
- Linije koje počinju sa `#` su komentari

## Provera

Nakon import-a, proveri da li su sve varijable učitane:
- `MONGODB_URI` ✓
- `MONGODB_DB` ✓
- `JWT_SECRET` ✓
- `NODE_ENV` ✓

## Troubleshooting

### Problem: "Invalid format"
**Rešenje:** Proveri da li je format ispravan (`KEY=value`, bez navodnika)

### Problem: "Some variables not imported"
**Rešenje:** Proveri da li su sve varijable u jednom redu (bez preloma linija u sredini vrednosti)

### Problem: "File not found"
**Rešenje:** Proveri da li je `.env` fajl u root folderu projekta
