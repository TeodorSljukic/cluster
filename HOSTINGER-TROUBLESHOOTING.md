# Hostinger Troubleshooting Guide

## Problem: "Something went wrong" Error

Ako vidite ovu grešku na Hostinger-u, proverite sledeće:

### 1. Environment Varijable

**Proverite da li su postavljene sve potrebne environment varijable u Hostinger kontrolnom panelu:**

1. Idite u **Hostinger hPanel** → **Websites** → **Advanced** → **Environment Variables**
2. Proverite da li su postavljene:
   - `MONGODB_URI` - MongoDB Atlas connection string
   - `MONGODB_DB` - Database name (obično "abgc")
   - `JWT_SECRET` - JWT secret key (generišite novi)
   - `NEXT_PUBLIC_BASE_URL` - Vaš domen (npr. "https://yourdomain.com")
   - `NODE_ENV` - Postavite na "production"

**Format:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/abgc?retryWrites=true&w=majority
MONGODB_DB=abgc
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. MongoDB Atlas Whitelist

**Proverite da li je Hostinger IP adresa u MongoDB Atlas whitelist-u:**

1. Idite u **MongoDB Atlas** → **Network Access**
2. Kliknite **"Add IP Address"**
3. Dodajte **"Allow Access from Anywhere"** (0.0.0.0/0) ili specifičnu IP adresu Hostinger servera

### 3. Build Proces

**Proverite da li je build uspešan:**

1. U Hostinger kontrolnom panelu, proverite **Build Logs**
2. Ako ima grešaka, proverite:
   - Da li su svi dependencies instalirani
   - Da li TypeScript kompajlira bez grešaka
   - Da li su svi fajlovi prisutni

### 4. Node.js Verzija

**Proverite Node.js verziju:**

1. U Hostinger kontrolnom panelu, proverite **Node.js Version**
2. Trebalo bi da bude **v20.x** ili novija
3. Ako nije, promenite verziju u kontrolnom panelu

### 5. Proverite Browser Console

**Otvorite Developer Tools (F12) i proverite Console:**

1. Otvorite sajt u browseru
2. Pritisnite **F12** da otvorite Developer Tools
3. Idite na **Console** tab
4. Proverite da li ima grešaka
5. Kopirajte greške i proverite šta kažu

### 6. Proverite Network Tab

**Proverite da li API pozivi rade:**

1. Otvorite **Network** tab u Developer Tools
2. Osvežite stranicu
3. Proverite da li ima failed requests (crveni)
4. Kliknite na failed request i proverite **Response** tab

### 7. Česti Problemi

#### Problem: "Missing MONGODB_URI"
**Rešenje:** Proverite da li je `MONGODB_URI` postavljen u environment varijablama

#### Problem: "Cannot connect to MongoDB"
**Rešenje:** 
- Proverite MongoDB Atlas whitelist
- Proverite da li je connection string ispravan
- Proverite da li imate internet konekciju

#### Problem: "JWT_SECRET is not defined"
**Rešenje:** Generišite novi JWT_SECRET i dodajte ga u environment varijable

#### Problem: Build fails
**Rešenje:**
- Proverite da li su svi fajlovi push-ovani na Git
- Proverite da li `package.json` ima sve dependencies
- Proverite build logs u Hostinger kontrolnom panelu

### 8. Debug Mode

**Za više informacija, možete privremeno uključiti debug mode:**

1. U environment varijablama, dodajte:
   ```
   NODE_ENV=development
   ```
2. Ovo će prikazati više detalja o greškama (ali ne koristite u production!)

### 9. Kontaktiranje Support-a

Ako ništa od navedenog ne pomaže:

1. Prikupite sledeće informacije:
   - Build logs sa Hostinger-a
   - Browser console errors
   - Network tab errors
   - Environment variables (bez lozinki!)
2. Kontaktirajte Hostinger support sa ovim informacijama

### 10. Quick Fix - Rebuild

Ponekad jednostavno rebuild rešava problem:

1. U Hostinger kontrolnom panelu, idite na **Deployments**
2. Kliknite **"Redeploy"** ili **"Rebuild"**
3. Sačekajte da se build završi
4. Proverite da li radi
